'use strict';

const template = require('babel-template');
const t = require('babel-types');
const generate = require('babel-generator').default;
const _ = require('lodash');
const generateBoobenValueAST = require('./generateBoobenValueAST');

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

const createLogoutAction = () =>
  t.expressionStatement(t.callExpression(t.identifier('logout'), []));

const createActionNavigate = ({ routeId, routeParams }, file, model) => {
  const routePath = model.routes[routeId].fullPath;
  if (_.isEmpty(routeParams)) {
    return template(`
      this.props.history.push('${routePath}')
    `)();
  } else {
    const paramIndex = routePath.search(/:.*/);
    const path = routePath.substring(0, paramIndex);
    const paramName = routePath.substring(paramIndex + 1);
    const routeParamsAst = generateBoobenValueAST(
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
    generateBoobenValueAST(argValue, null, file)
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

  const urlValue = generateBoobenValueAST(url, null, file);
  const bodyValue = generateBoobenValueAST(body, null, file);
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

  const valueExpression = generateBoobenValueAST(value, null, file);

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
  file,
  model
) => {
  const variables = Object.keys(args).map(key =>
    t.objectProperty(
      t.identifier(key),
      t.callExpression(generateBoobenValueAST(args[key], null, file), []) 
    )
  );

  let setAuthTokenAST = null;

  const auth = model.project.auth;
  if (auth.loginMutation === mutation) {
    const tokenPath = auth.tokenPath.reduceRight(
      (acc, cur) => `.${cur}` + acc,
      ''
    );

    setAuthTokenAST = template(`
      localStorage.setItem('token', data.data.${mutation}${tokenPath})
    `)();
  }

  const mutationActionTemplate = template(`
    this.props.${mutation}Mutation({
      variables: VARIABLES
    })
    .then(data => {
      SET_AUTH_TOKEN
      SUCCESS_ACTIONS
    })
    .catch(err => {
      ERROR_ACTIONS
    })
  `);

  return mutationActionTemplate({
    VARIABLES: t.objectExpression(variables),
    SET_AUTH_TOKEN: setAuthTokenAST,
    SUCCESS_ACTIONS: successActions.map(action =>
      createAction(action, file, model)
    ),
    ERROR_ACTIONS: errorActions.map(action =>
      createAction(action, file, model)
    ),
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
  const valueExpression = generateBoobenValueAST(params.value, null, file);

  // this.setState({ /*stateKey*/: /*valueExpression*/ });
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
 * @param {string} type
 * @param {Object} params
 * @param {ComponentFileModel} file
 * @return {ExpressionStatement}
 */
const createAction = ({ type, params }, file, model) => {
  switch (type) {
    case 'url':
      return createActionUrl(params);
    case 'logout':
      return createLogoutAction();
    case 'navigate':
      return createActionNavigate(params, file, model);
    case 'method':
      return createActionMethod(params, file);
    case 'ajax':
      return createActionAjax(params, file);
    case 'prop':
      return createPropAction(params, file);
    case 'mutation':
      return createMutationAction(params, file, model);
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
const generateHandlerAST = ({ path, actions }, file, model) => {
  const handlerName = formatHandlerName(path);
  const actionExpressions = actions.map(action => {
    return createAction(action, file, model);
  });

  if (actionExpressions.length === 0) {
    return {
      handlerAST: null,
      handlerBindingAST: null,
    };
  }

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
