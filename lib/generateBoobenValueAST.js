'use strict';

const t = require('babel-types');
const _ = require('lodash');

const {
  formatHandlerName,
  formatComponentStateSlotKey,
  formatDesignedComponentName,
  formatQueryNamespace,
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
 * @param {Object} boobenValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {Object}
 */
const staticBoobenValue = (boobenValue, path, file) => {
  const value = boobenValue.sourceData.value;

  if (_.isArray(value)) {
    return t.arrayExpression(
      value.map((itemValue, index) =>
        generateBoobenValueAST(
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
        generateBoobenValueAST(
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
 * @param {Object} boobenValue
 * @return {StringLiteral|NumericLiteral|BooleanLiteral|NullLiteral|ArrayExpression|ObjectExpression}
 */
const constBoobenValue = boobenValue =>
  generateLiteral(boobenValue.sourceData.value);

/**
 *
 * @param {Object} boobenValue
 * @return {MemberExpression}
 */
const routeParamsBoobenValue = boobenValue =>
  // this.props.match.params./*boobenValue.sourceData.paramName*/
  t.memberExpression(
    t.memberExpression(
      t.memberExpression(
        t.memberExpression(t.thisExpression(), t.identifier('props')),
        t.identifier('match')
      ),
      t.identifier('params')
    ),
    t.identifier(boobenValue.sourceData.paramName)
  );

/**
 *
 * @param {?Path} path
 * @return {MemberExpression}
 */
const actionBoobenValue = path =>
  // this./*handlerName*/
  t.memberExpression(t.thisExpression(), t.identifier(formatHandlerName(path)));

/**
 *
 * @param {Object} boobenValue
 * @param {ComponentFileModel} file
 * @return {MemberExpression}
 */
const stateBoobenValue = (boobenValue, file) => {
  const { componentId, stateSlot } = boobenValue.sourceData;
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
 * @param {Object} boobenValue
 * @return {MemberExpression}
 */
const argBoobenValue = boobenValue => {
  const expr = path => {
    const last = path[path.length - 1];

    return t.memberExpression(
      path.length > 1 ? expr(path.slice(0, -1)) : t.identifier('args'),
      _.isString(last) ? t.stringLiteral(last) : t.numericLiteral(last),
      true
    );
  };

  return expr([boobenValue.sourceData.arg, ...boobenValue.sourceData.path]);
};

/**
 *
 * @param {Object} boobenValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {CallExpression}
 */
const functionBoobenValue = (boobenValue, path, file) => {
  const argASTs = boobenValue.sourceData.args.map((argValue, index) => {
    if (argValue === null) {
      return t.identifier('undefined');
    }

    return generateBoobenValueAST(
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

  // /*boobenValue.sourceData.function*/(/*argASTs*/)
  return t.callExpression(
    t.identifier(boobenValue.sourceData.function),
    argASTs
  );
};

/**
 *
 * @param {Object} boobenValue
 * @return {MemberExpression}
 */
const actionArgBoobenValue = boobenValue =>
  // args[/*boobenValue.sourceData.arg*/]
  t.memberExpression(
    t.identifier('args'),
    t.numericLiteral(boobenValue.sourceData.arg)
  );

/**
 *
 * @param {Object} boobenValue
 * @return {MemberExpression}
 */
const propBoobenValue = boobenValue =>
  // this.props./*boobenValue.sourceData.propName*/
  t.memberExpression(
    t.memberExpression(t.thisExpression(), t.identifier('props')),
    t.identifier(boobenValue.sourceData.propName)
  );

/**
 *
 * @param {Object} boobenValue
 * @return {MemberExpression}
 */
const ownerPropBoobenValue = boobenValue =>
  // this.props./*boobenValue.sourceData.ownerPropName*/
  t.memberExpression(
    t.memberExpression(t.thisExpression(), t.identifier('props')),
    t.identifier(boobenValue.sourceData.ownerPropName)
  );

/**
 *
 * @param {Path} path
 * @return {Identifier}
 */
const designerBoobenValue = path =>
  // /* ComponentName */
  t.identifier(formatDesignedComponentName(path));

/**
 *
 * @param {Object} boobenValue
 * @return {MemberExpression}
 */

const dataBoobenValue = (boobenValue, path, file) => {
  const { queryPath, dataContext } = boobenValue.sourceData;
  if (file.queries.size > 0) {
    queryPath.unshift({ field: formatQueryNamespace(queryPath[0].field) });
  }
  if (queryPath === null) return t.arrayExpression();

  const memberExpressionCallback = (acc, cur) =>
    t.memberExpression(acc, t.identifier(cur));

  const contextMemberExpression = t.memberExpression(
    t.thisExpression(),
    t.identifier('props')
  );

  return dataContext
    .concat(queryPath.map(item => item.field))
    .reduce(memberExpressionCallback, contextMemberExpression);
};

/**
 *
 * @param {Object} boobenValue
 * @param {?Path} path
 * @param {ComponentFileModel} file
 * @return {Expression}
 */
const generateBoobenValueAST = (boobenValue, path, file, model) => {
  if (boobenValue === null) return t.nullLiteral();
  switch (boobenValue.source) {
    case 'const':
      return constBoobenValue(boobenValue);
    case 'static':
      return staticBoobenValue(boobenValue, path, file);
    case 'ownerProp':
      return ownerPropBoobenValue(boobenValue);
    case 'routeParams':
      return routeParamsBoobenValue(boobenValue);
    case 'designer':
      return designerBoobenValue(path);
    case 'actions':
      return actionBoobenValue(path);
    case 'state':
      return stateBoobenValue(boobenValue, file);
    case 'function':
      return functionBoobenValue(boobenValue, path, file);
    case 'arg':
      return argBoobenValue(boobenValue);
    case 'actionArg':
      return actionArgBoobenValue(boobenValue);
    case 'prop':
      return propBoobenValue(boobenValue);
    case 'data':
      return dataBoobenValue(boobenValue, path, file);
    default:
      throw new Error(`Unknown BoobenValue source: ${boobenValue.source}`);
  }
};

module.exports = generateBoobenValueAST;
