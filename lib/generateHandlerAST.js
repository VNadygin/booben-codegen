'use strict';

const template = require('babel-template');
const t = require('babel-types');
const generate = require('babel-generator').default;
const _ = require('lodash');
const generateJssyValueAST = require('./generateJssyValueAST');

const {
  formatHandlerName,
  formatStateKeyForProp,
  formatComponentStateSlotKey,
  formatComponentRefKey,
} = require('./names');

/**
 *
 * @param {string} url
 * @param {boolean} newWindow
 * @return {ExpressionStatement}
 */
const createActionUrl = ({ url, newWindow }) =>
  t.expressionStatement(
    t.callExpression(t.identifier('openUrl'), [
      t.stringLiteral(url),
      t.booleanLiteral(newWindow),
    ])
  );

const createActionNavigate = ({ routeId, routeParams }, file) => {
  const routePath = file.routePaths.get(routeId);
  if (_.isEmpty(routeParams)) {
    return template(`
      this.props.history.push('${routePath}')
    `)();
  } else {
    const paramIndex = routePath.search(/:.*/);
    const path = routePath.substring(0, paramIndex);
    const paramName = routePath.substring(paramIndex + 1);
    const routeParamsAst = generateJssyValueAST(
      routeParams[paramName],
      null,
      file
    );
    const { code } = generate(routeParamsAst);
    const pathWithParams = '`' + path + '${' + `${code}` + '}`';

    return template(`
      this.props.history.push(${pathWithParams})
    `)();
  }
};

/**
 *
 * @param {number} componentId
 * @param {string} method
 * @param {Array<Object>} args
 * @param {ComponentFileModel} file
 * @return {ExpressionStatement}
 */
const createActionMethod = ({ componentId, method, args }, file) => {
  const component = file.components[componentId];
  const refKey = formatComponentRefKey(component);
  const argumentsAst = args.map(argValue =>
    generateJssyValueAST(argValue, null, file)
  );

  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.memberExpression(t.thisExpression(), t.identifier(refKey)),
        t.identifier(method)
      ),
      argumentsAst
    )
  );
};

const createActionAjax = (params, file) => {
  //TODO: Headers
  const {
    body,
    decodeResponse,
    method,
    mode,
    successActions,
    url,
    errorActions,
  } = params;

  const urlValue = generateJssyValueAST(url, null, file);
  const bodyValue = generateJssyValueAST(body, null, file);
  //TODO: ARRAY_BUFFER
  let decodeResponseAST;
  if (decodeResponse === 'text')
    decodeResponseAST = template('return res.text()')();
  else if (decodeResponse === 'json')
    decodeResponseAST = template('return res.json()')();
  else if (decodeResponse === 'blob')
    decodeResponseAST = template('return res.blob()')();

  const actionTemplate = template(`
    fetch(URL, {
      method: ${method},
      credentials: ${mode}, 
      body: BODY,
    })
    .then(res => {
      DECODE
    })
    .then(data => {
      SUCCESS_ACTIONS
    })
    .catch(err => {
      ERROR_ACTIONS
    })

  `);

  return actionTemplate({
    URL: urlValue,
    BODY: bodyValue,
    DECODE: decodeResponseAST,
    SUCCESS_ACTIONS: successActions.map(createAction),
    ERROR_ACTIONS: errorActions.map(createAction),
  });
};

/**
 *
 * @param {number} componentId
 * @param {string} propName
 * @param {string} systemPropName
 * @param {Object} value
 * @param {ComponentFileModel} file
 * @return {ExpressionStatement}
 */
const createPropAction = (
  { componentId, propName, systemPropName, value },
  file
) => {
  let actualPropName;
  let isSystemProp;

  if (systemPropName) {
    actualPropName = systemPropName;
    isSystemProp = true;
  } else {
    actualPropName = propName;
    isSystemProp = false;
  }

  const targetComponent = file.components[componentId];
  const stateKey = formatStateKeyForProp(
    targetComponent,
    actualPropName,
    isSystemProp
  );

  const valueExpression = generateJssyValueAST(value, null, file);

  // this.setState({ /*setState*/: () => /*valueExpression*/ });
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(t.thisExpression(), t.identifier('setState')),
      [
        t.objectExpression([
          t.objectProperty(
            t.identifier(stateKey),
            t.arrowFunctionExpression([], valueExpression)
          ),
        ]),
      ]
    )
  );
};

/**
 *
 * @param {string} mutation
 * @param {Object<string, Object>} args
 * @param {Array<Object>} successActions
 * @param {Array<Object>} errorActions
 * @param {ComponentFileModel} file
 * @return {ExpressionStatement}
 */
const createMutationAction = (
  { mutation, args, successActions, errorActions },
  file
) => {
  const variables = Object.keys(args).map(key =>
    t.objectProperty(
      t.identifier(key),
      generateJssyValueAST(args[key], null, file)
    )
  );

  const mutationActionTemplate = template(`
    this.props.${mutation}Mutation({
      variables: VARIABLES
    })
    .then(data => {
      SUCCESS_ACTIONS
    })
    .catch(err => {
      ERROR_ACTIONS
    })
  `);

  return mutationActionTemplate({
    VARIABLES: t.objectExpression(variables),
    SUCCESS_ACTIONS: successActions.map(action => createAction(action, file)),
    ERROR_ACTIONS: errorActions.map(action => createAction(action, file)),
  });
};

/**
 *
 * @param {Object} params
 * @param {ComponentFileModel} file
 * @return {ExpressionStatement}
 */
const createSetStateAction = (params, file) => {
  const component = file.components[params.componentId];
  const stateKey = formatComponentStateSlotKey(component, params.stateSlot);
  const valueExpression = generateJssyValueAST(params.value, null, file);

  // this.setState({ /*stateKey*/: /*valueExpression*/ });
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(t.thisExpression(), t.identifier('setState')),
      [
        t.objectExpression([
          t.objectProperty(t.identifier(stateKey), valueExpression),
        ]),
      ]
    )
  );
};

/**
 *
 * @param {string} type
 * @param {Object} params
 * @param {ComponentFileModel} file
 * @return {ExpressionStatement}
 */
const createAction = ({ type, params }, file) => {
  switch (type) {
    case 'url':
      return createActionUrl(params);
    case 'navigate':
      return createActionNavigate(params, file);
    case 'method':
      return createActionMethod(params, file);
    case 'ajax':
      return createActionAjax(params, file);
    case 'prop':
      return createPropAction(params, file);
    case 'mutation':
      return createMutationAction(params, file);
    case 'setState':
      return createSetStateAction(params, file);
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
};

/**
 *
 * @param {Path} path
 * @param {Array<Object>} actions
 * @param {ComponentFileModel} file
 * @return {{ handlerAST: ClassMethod, handlerBindingAST: ExpressionStatement }}
 */
const generateHandlerAST = ({ path, actions }, file) => {
  const handlerName = formatHandlerName(path);
  const actionExpressions = actions.map(action => createAction(action, file));

  // /*handlerName*/(...args) {
  //   /*actionExpressions*/
  // }
  const handlerAST = t.classMethod(
    'method',
    t.identifier(handlerName),
    [t.restElement(t.identifier('args'))],
    t.blockStatement(actionExpressions)
  );

  // this./*handlerName*/ = this./*handlerName*/.bind(this);
  const handlerBindingAST = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(t.thisExpression(), t.identifier(handlerName)),
      t.callExpression(
        t.memberExpression(
          t.memberExpression(t.thisExpression(), t.identifier(handlerName)),
          t.identifier('bind')
        ),
        [t.thisExpression()]
      )
    )
  );

  return { handlerAST, handlerBindingAST };
};

module.exports = generateHandlerAST;
