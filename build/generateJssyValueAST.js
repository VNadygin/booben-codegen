'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var t = require('babel-types');
var _ = require('lodash');

var _require = require('./names'),
    formatHandlerName = _require.formatHandlerName,
    formatComponentStateSlotKey = _require.formatComponentStateSlotKey,
    formatDesignedComponentName = _require.formatDesignedComponentName,
    formatQueryNamespace = _require.formatQueryNamespace;

var Path = require('./Path');

/**
 *
 * @param {*} value
 * @return {StringLiteral|NumericLiteral|BooleanLiteral|NullLiteral|ArrayExpression|ObjectExpression}
 */
var generateLiteral = function generateLiteral(value) {
  if (_.isString(value)) return t.stringLiteral(value);
  if (_.isBoolean(value)) return t.booleanLiteral(value);
  if (_.isNumber(value)) return t.numericLiteral(value);
  if (_.isNull(value)) return t.nullLiteral();
  if (_.isArray(value)) return t.arrayExpression(value.map(generateLiteral));
  if (_.isObject(value)) {
    var properties = Object.keys(value).map(function (key) {
      return t.objectProperty(t.identifier(key), generateLiteral(value[key]));
    });

    return t.objectExpression(properties);
  }

  throw new Error('generateLiteral: unsupported value: ' + value);
};

/**
 *
 * @param {Object} jssyValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {Object}
 */
var staticJssyValue = function staticJssyValue(jssyValue, path, file) {
  var value = jssyValue.sourceData.value;

  if (_.isArray(value)) {
    return t.arrayExpression(value.map(function (itemValue, index) {
      return generateJssyValueAST(itemValue, path ? path.extend({ type: Path.StepTypes.ARRAY_INDEX, value: index }) : null, file);
    }));
  }

  if (_.isObject(value)) {
    var properties = [];
    _.forOwn(value, function (itemValue, key) {
      var property = t.objectProperty(t.identifier(key), generateJssyValueAST(itemValue, path ? path.extend({ type: Path.StepTypes.OBJECT_KEY, value: key }) : null, file));

      properties.push(property);
    });

    return t.objectExpression(properties);
  }

  return generateLiteral(value);
};

/**
 *
 * @param {Object} jssyValue
 * @return {StringLiteral|NumericLiteral|BooleanLiteral|NullLiteral|ArrayExpression|ObjectExpression}
 */
var constJssyValue = function constJssyValue(jssyValue) {
  return generateLiteral(jssyValue.sourceData.value);
};

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
var routeParamsJssyValue = function routeParamsJssyValue(jssyValue) {
  return (
    // this.props.match.params./*jssyValue.sourceData.paramName*/
    t.memberExpression(t.memberExpression(t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('props')), t.identifier('match')), t.identifier('params')), t.identifier(jssyValue.sourceData.paramName))
  );
};

/**
 *
 * @param {?Path} path
 * @return {MemberExpression}
 */
var actionJssyValue = function actionJssyValue(path) {
  return (
    // this./*handlerName*/
    t.memberExpression(t.thisExpression(), t.identifier(formatHandlerName(path)))
  );
};

/**
 *
 * @param {Object} jssyValue
 * @param {ComponentFileModel} file
 * @return {MemberExpression}
 */
var stateJssyValue = function stateJssyValue(jssyValue, file) {
  var _jssyValue$sourceData = jssyValue.sourceData,
      componentId = _jssyValue$sourceData.componentId,
      stateSlot = _jssyValue$sourceData.stateSlot;

  var component = file.components[componentId];
  var stateKey = formatComponentStateSlotKey(component, stateSlot);

  // this.state./*stateKey*/
  return t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('state')), t.identifier(stateKey));
};

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
var argJssyValue = function argJssyValue(jssyValue) {
  var expr = function expr(path) {
    var last = path[path.length - 1];

    return t.memberExpression(path.length > 1 ? expr(path.slice(0, -1)) : t.identifier('args'), _.isString(last) ? t.stringLiteral(last) : t.numericLiteral(last), true);
  };

  return expr([jssyValue.sourceData.arg].concat(_toConsumableArray(jssyValue.sourceData.path)));
};

/**
 *
 * @param {Object} jssyValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {CallExpression}
 */
var functionJssyValue = function functionJssyValue(jssyValue, path, file) {
  var argASTs = jssyValue.sourceData.args.map(function (argValue, index) {
    if (argValue === null) {
      return t.identifier('undefined');
    }

    return generateJssyValueAST(argValue, path ? path.extend([{ type: Path.StepTypes.SWITCH, value: 'args' }, { type: Path.StepTypes.FUNCTION_ARG, value: index }]) : null, file);
  });

  // /*jssyValue.sourceData.function*/(/*argASTs*/)
  return t.callExpression(t.identifier(jssyValue.sourceData.function), argASTs);
};

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
var actionArgJssyValue = function actionArgJssyValue(jssyValue) {
  return (
    // args[/*jssyValue.sourceData.arg*/]
    t.memberExpression(t.identifier('args'), t.numericLiteral(jssyValue.sourceData.arg))
  );
};

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
var propJssyValue = function propJssyValue(jssyValue) {
  return (
    // this.props./*jssyValue.sourceData.propName*/
    t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('props')), t.identifier(jssyValue.sourceData.propName))
  );
};

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
var ownerPropJssyValue = function ownerPropJssyValue(jssyValue) {
  return (
    // this.props./*jssyValue.sourceData.ownerPropName*/
    t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('props')), t.identifier(jssyValue.sourceData.ownerPropName))
  );
};

/**
 *
 * @param {Path} path
 * @return {Identifier}
 */
var designerJssyValue = function designerJssyValue(path) {
  return (
    // /* ComponentName */
    t.identifier(formatDesignedComponentName(path))
  );
};

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */

var dataJssyValue = function dataJssyValue(jssyValue, path, file) {
  var _jssyValue$sourceData2 = jssyValue.sourceData,
      queryPath = _jssyValue$sourceData2.queryPath,
      dataContext = _jssyValue$sourceData2.dataContext;

  if (file.queries.size > 0) {
    queryPath.unshift({ field: formatQueryNamespace(queryPath[0].field) });
  }
  if (queryPath === null) return t.arrayExpression();

  var memberExpressionCallback = function memberExpressionCallback(acc, cur) {
    return t.memberExpression(acc, t.identifier(cur));
  };

  var contextMemberExpression = t.memberExpression(t.thisExpression(), t.identifier('props'));

  return dataContext.concat(queryPath.map(function (item) {
    return item.field;
  })).reduce(memberExpressionCallback, contextMemberExpression);
};

/**
 *
 * @param {Object} jssyValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {Expression}
 */
var generateJssyValueAST = function generateJssyValueAST(jssyValue, path, file, model) {
  if (jssyValue === null) return t.nullLiteral();
  switch (jssyValue.source) {
    case 'const':
      return constJssyValue(jssyValue);
    case 'static':
      return staticJssyValue(jssyValue, path, file);
    case 'ownerProp':
      return ownerPropJssyValue(jssyValue);
    case 'routeParams':
      return routeParamsJssyValue(jssyValue);
    case 'designer':
      return designerJssyValue(path);
    case 'actions':
      return actionJssyValue(path);
    case 'state':
      return stateJssyValue(jssyValue, file);
    case 'function':
      return functionJssyValue(jssyValue, path, file);
    case 'arg':
      return argJssyValue(jssyValue);
    case 'actionArg':
      return actionArgJssyValue(jssyValue);
    case 'prop':
      return propJssyValue(jssyValue);
    case 'data':
      return dataJssyValue(jssyValue, path, file);
    default:
      throw new Error('Unknown JssyValue source: ' + jssyValue.source);
  }
};

module.exports = generateJssyValueAST;
//# sourceMappingURL=generateJssyValueAST.js.map