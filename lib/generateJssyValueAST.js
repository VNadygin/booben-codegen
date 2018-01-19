'use strict';

const t = require('babel-types');
const _ = require('lodash');

const {
  formatHandlerName,
  formatComponentStateSlotKey,
  formatDesignedComponentName,
} = require('./names');

const Path = require('./Path');

/**
 *
 * @param {*} value
 * @return {StringLiteral|NumericLiteral|BooleanLiteral|NullLiteral|ArrayExpression|ObjectExpression}
 */
const generateLiteral = value => {
  if (_.isString(value)) return t.stringLiteral(value);
  if (_.isBoolean(value)) return t.booleanLiteral(value);
  if (_.isNumber(value)) return t.numericLiteral(value);
  if (_.isNull(value)) return t.nullLiteral();
  if (_.isArray(value)) return t.arrayExpression(value.map(generateLiteral));
  if (_.isObject(value)) {
    const properties = Object.keys(value).map(key =>
      t.objectProperty(t.identifier(key), generateLiteral(value[key]))
    );

    return t.objectExpression(properties);
  }

  throw new Error(`generateLiteral: unsupported value: ${value}`);
};

/**
 *
 * @param {Object} jssyValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {Object}
 */
const staticJssyValue = (jssyValue, path, file) => {
  const value = jssyValue.sourceData.value;

  if (_.isArray(value)) {
    return t.arrayExpression(
      value.map((itemValue, index) =>
        generateJssyValueAST(
          itemValue,
          path
            ? path.extend({ type: Path.StepTypes.ARRAY_INDEX, value: index })
            : null,
          file
        )
      )
    );
  }

  if (_.isObject(value)) {
    const properties = [];
    _.forOwn(value, (itemValue, key) => {
      const property = t.objectProperty(
        t.identifier(key),
        generateJssyValueAST(
          itemValue,
          path
            ? path.extend({ type: Path.StepTypes.OBJECT_KEY, value: key })
            : null,
          file
        )
      );

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
const constJssyValue = jssyValue => generateLiteral(jssyValue.sourceData.value);

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
const routeParamsJssyValue = jssyValue =>
  // this.props.match.params./*jssyValue.sourceData.paramName*/
  t.memberExpression(
    t.memberExpression(
      t.memberExpression(
        t.memberExpression(t.thisExpression(), t.identifier('props')),
        t.identifier('match')
      ),
      t.identifier('params')
    ),
    t.identifier(jssyValue.sourceData.paramName)
  );

/**
 *
 * @param {?Path} path
 * @return {MemberExpression}
 */
const actionJssyValue = path =>
  // this./*handlerName*/
  t.memberExpression(t.thisExpression(), t.identifier(formatHandlerName(path)));

/**
 *
 * @param {Object} jssyValue
 * @param {ComponentFileModel} file
 * @return {MemberExpression}
 */
const stateJssyValue = (jssyValue, file) => {
  const { componentId, stateSlot } = jssyValue.sourceData;
  const component = file.components[componentId];
  const stateKey = formatComponentStateSlotKey(component, stateSlot);

  // this.state./*stateKey*/
  return t.memberExpression(
    t.memberExpression(t.thisExpression(), t.identifier('state')),
    t.identifier(stateKey)
  );
};

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
const argJssyValue = jssyValue => {
  const expr = path => {
    const last = path[path.length - 1];

    return t.memberExpression(
      path.length > 1 ? expr(path.slice(0, -1)) : t.identifier('args'),
      _.isString(last) ? t.stringLiteral(last) : t.numericLiteral(last),
      true
    );
  };

  return expr([jssyValue.sourceData.arg, ...jssyValue.sourceData.path]);
};

/**
 *
 * @param {Object} jssyValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {CallExpression}
 */
const functionJssyValue = (jssyValue, path, file) => {
  const argASTs = jssyValue.sourceData.args.map((argValue, index) => {
    if (argValue === null) {
      return t.identifier('undefined');
    }

    return generateJssyValueAST(
      argValue,
      path
        ? path.extend([
            { type: Path.StepTypes.SWITCH, value: 'args' },
            { type: Path.StepTypes.FUNCTION_ARG, value: index },
          ])
        : null,
      file
    );
  });

  // /*jssyValue.sourceData.function*/(/*argASTs*/)
  return t.callExpression(t.identifier(jssyValue.sourceData.function), argASTs);
};

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
const actionArgJssyValue = jssyValue =>
  // args[/*jssyValue.sourceData.arg*/]
  t.memberExpression(
    t.identifier('args'),
    t.numericLiteral(jssyValue.sourceData.arg)
  );

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
const propJssyValue = jssyValue =>
  // this.props./*jssyValue.sourceData.propName*/
  t.memberExpression(
    t.memberExpression(t.thisExpression(), t.identifier('props')),
    t.identifier(jssyValue.sourceData.propName)
  );

/**
 *
 * @param {Object} jssyValue
 * @return {MemberExpression}
 */
const ownerPropJssyValue = jssyValue =>
  // this.props./*jssyValue.sourceData.ownerPropName*/
  t.memberExpression(
    t.memberExpression(t.thisExpression(), t.identifier('props')),
    t.identifier(jssyValue.sourceData.ownerPropName)
  );

/**
 *
 * @param {Path} path
 * @return {Identifier}
 */
const designerJssyValue = path =>
  // /* ComponentName */
  t.identifier(formatDesignedComponentName(path));

/**
 *
 * @param {Object} jssyValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {Expression}
 */
const generateJssyValueAST = (jssyValue, path, file) => {
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
    default:
      throw new Error(`Unknown JssyValue source: ${jssyValue.source}`);
  }
};

module.exports = generateJssyValueAST;
