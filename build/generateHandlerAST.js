'use strict';

var template = require('babel-template');
var t = require('babel-types');
var generate = require('babel-generator').default;
var _ = require('lodash');
var generateJssyValueAST = require('./generateJssyValueAST');

var _require = require('./names'),
    formatHandlerName = _require.formatHandlerName,
    formatStateKeyForProp = _require.formatStateKeyForProp,
    formatComponentStateSlotKey = _require.formatComponentStateSlotKey,
    formatComponentRefKey = _require.formatComponentRefKey;

/**
 *
 * @param {string} url
 * @param {boolean} newWindow
 * @return {ExpressionStatement}
 */


var createActionUrl = function createActionUrl(_ref) {
  var url = _ref.url,
      newWindow = _ref.newWindow;
  return t.expressionStatement(t.callExpression(t.identifier('openUrl'), [t.stringLiteral(url), t.booleanLiteral(newWindow)]));
};

var createActionNavigate = function createActionNavigate(_ref2, file) {
  var routeId = _ref2.routeId,
      routeParams = _ref2.routeParams;

  var routePath = file.routePaths.get(routeId);
  if (_.isEmpty(routeParams)) {
    return template('\n      this.props.history.push(\'' + routePath + '\')\n    ')();
  } else {
    var paramIndex = routePath.search(/:.*/);
    var path = routePath.substring(0, paramIndex);
    var paramName = routePath.substring(paramIndex + 1);
    var routeParamsAst = generateJssyValueAST(routeParams[paramName], null, file);

    var _generate = generate(routeParamsAst),
        code = _generate.code;

    var pathWithParams = '`' + path + '${' + ('' + code) + '}`';

    return template('\n      this.props.history.push(' + pathWithParams + ')\n    ')();
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
var createActionMethod = function createActionMethod(_ref3, file) {
  var componentId = _ref3.componentId,
      method = _ref3.method,
      args = _ref3.args;

  var component = file.components[componentId];
  var refKey = formatComponentRefKey(component);
  var argumentsAst = args.map(function (argValue) {
    return generateJssyValueAST(argValue, null, file);
  });

  return t.expressionStatement(t.callExpression(t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier(refKey)), t.identifier(method)), argumentsAst));
};

var createActionAjax = function createActionAjax(params, file) {
  //TODO: Headers
  var body = params.body,
      decodeResponse = params.decodeResponse,
      method = params.method,
      mode = params.mode,
      successActions = params.successActions,
      url = params.url,
      errorActions = params.errorActions;


  var urlValue = generateJssyValueAST(url, null, file);
  var bodyValue = generateJssyValueAST(body, null, file);
  //TODO: ARRAY_BUFFER
  var decodeResponseAST = void 0;
  if (decodeResponse === 'text') decodeResponseAST = template('return res.text()')();else if (decodeResponse === 'json') decodeResponseAST = template('return res.json()')();else if (decodeResponse === 'blob') decodeResponseAST = template('return res.blob()')();

  var actionTemplate = template('\n    fetch(URL, {\n      method: ' + method + ',\n      credentials: ' + mode + ', \n      body: BODY,\n    })\n    .then(res => {\n      DECODE\n    })\n    .then(data => {\n      SUCCESS_ACTIONS\n    })\n    .catch(err => {\n      ERROR_ACTIONS\n    })\n\n  ');

  return actionTemplate({
    URL: urlValue,
    BODY: bodyValue,
    DECODE: decodeResponseAST,
    SUCCESS_ACTIONS: successActions.map(createAction),
    ERROR_ACTIONS: errorActions.map(createAction)
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
var createPropAction = function createPropAction(_ref4, file) {
  var componentId = _ref4.componentId,
      propName = _ref4.propName,
      systemPropName = _ref4.systemPropName,
      value = _ref4.value;

  var actualPropName = void 0;
  var isSystemProp = void 0;

  if (systemPropName) {
    actualPropName = systemPropName;
    isSystemProp = true;
  } else {
    actualPropName = propName;
    isSystemProp = false;
  }

  var targetComponent = file.components[componentId];
  var stateKey = formatStateKeyForProp(targetComponent, actualPropName, isSystemProp);

  var valueExpression = generateJssyValueAST(value, null, file);

  // this.setState({ /*setState*/: () => /*valueExpression*/ });
  return t.expressionStatement(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('setState')), [t.objectExpression([t.objectProperty(t.identifier(stateKey), t.arrowFunctionExpression([], valueExpression))])]));
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
var createMutationAction = function createMutationAction(_ref5, file) {
  var mutation = _ref5.mutation,
      args = _ref5.args,
      successActions = _ref5.successActions,
      errorActions = _ref5.errorActions;

  var variables = Object.keys(args).map(function (key) {
    return t.objectProperty(t.identifier(key), generateJssyValueAST(args[key], null, file));
  });

  var setAuthTokenAST = void 0;
  if (file.auth.loginMutation === mutation) {
    var tokenPath = file.auth.tokenPath.reduceRight(function (acc, cur) {
      return '.' + cur + acc;
    }, '');

    setAuthTokenAST = template('\n      localStorage.setItem(\'token\', data.' + mutation + tokenPath + ')\n    ')();
  }

  var mutationActionTemplate = template('\n    this.props.' + mutation + 'Mutation({\n      variables: VARIABLES\n    })\n    .then(data => {\n      SET_AUTH_TOKEN\n      SUCCESS_ACTIONS\n    })\n    .catch(err => {\n      ERROR_ACTIONS\n    })\n  ');

  return mutationActionTemplate({
    VARIABLES: t.objectExpression(variables),
    SET_AUTH_TOKEN: setAuthTokenAST,
    SUCCESS_ACTIONS: successActions.map(function (action) {
      return createAction(action, file);
    }),
    ERROR_ACTIONS: errorActions.map(function (action) {
      return createAction(action, file);
    })
  });
};

/**
 *
 * @param {Object} params
 * @param {ComponentFileModel} file
 * @return {ExpressionStatement}
 */
var createSetStateAction = function createSetStateAction(params, file) {
  var component = file.components[params.componentId];
  var stateKey = formatComponentStateSlotKey(component, params.stateSlot);
  var valueExpression = generateJssyValueAST(params.value, null, file);

  // this.setState({ /*stateKey*/: /*valueExpression*/ });
  return t.expressionStatement(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('setState')), [t.objectExpression([t.objectProperty(t.identifier(stateKey), valueExpression)])]));
};

/**
 *
 * @param {string} type
 * @param {Object} params
 * @param {ComponentFileModel} file
 * @return {ExpressionStatement}
 */
var createAction = function createAction(_ref6, file) {
  var type = _ref6.type,
      params = _ref6.params;

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
      throw new Error('Unknown action type: ' + type);
  }
};

/**
 *
 * @param {Path} path
 * @param {Array<Object>} actions
 * @param {ComponentFileModel} file
 * @return {{ handlerAST: ClassMethod, handlerBindingAST: ExpressionStatement }}
 */
var generateHandlerAST = function generateHandlerAST(_ref7, file) {
  var path = _ref7.path,
      actions = _ref7.actions;

  var handlerName = formatHandlerName(path);
  var actionExpressions = actions.map(function (action) {
    return createAction(action, file);
  });

  if (actionExpressions.length === 0) {
    return {
      handlerAST: null,
      handlerBindingAST: null
    };
  }

  // /*handlerName*/(...args) {
  //   /*actionExpressions*/
  // }
  var handlerAST = t.classMethod('method', t.identifier(handlerName), [t.restElement(t.identifier('args'))], t.blockStatement(actionExpressions));

  // this./*handlerName*/ = this./*handlerName*/.bind(this);
  var handlerBindingAST = t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.thisExpression(), t.identifier(handlerName)), t.callExpression(t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier(handlerName)), t.identifier('bind')), [t.thisExpression()])));

  return { handlerAST: handlerAST, handlerBindingAST: handlerBindingAST };
};

module.exports = generateHandlerAST;
//# sourceMappingURL=generateHandlerAST.js.map