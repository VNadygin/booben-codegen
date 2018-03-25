'use strict';

var t = require('babel-types');
var generateJssyValue = require('./generateJssyValueAST');
var Path = require('./Path');

var _require = require('./misc'),
    getComponentMeta = _require.getComponentMeta;

var _require2 = require('./names'),
    formatStateKeyForProp = _require2.formatStateKeyForProp,
    formatComponentStateSlotKey = _require2.formatComponentStateSlotKey;

/**
 *
 * @param {ComponentFileModel} file
 * @param {Object} model
 * @return {?ExpressionStatement}
 */


var generateState = function generateState(file, model) {
  var statePropertyASTs = [];

  file.propsState.forEach(function (propNames, componentId) {
    var component = file.components[componentId];

    propNames.forEach(function (propName) {
      var stateKey = formatStateKeyForProp(component, propName, false);
      var path = new Path([{ type: Path.StepTypes.COMPONENT_ID, value: componentId }, { type: Path.StepTypes.SWITCH, value: 'props' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName }]);

      var initialValue = generateJssyValue(component.props[propName], path, file);

      // stateKey: () => /*initialValue*/
      var statePropertyAST = t.objectProperty(t.identifier(stateKey), t.arrowFunctionExpression([], initialValue));

      statePropertyASTs.push(statePropertyAST);
    });
  });

  file.systemPropsState.forEach(function (propNames, componentId) {
    var component = file.components[componentId];

    propNames.forEach(function (propName) {
      var stateKey = formatStateKeyForProp(component, propName, true);
      var path = new Path([{ type: Path.StepTypes.COMPONENT_ID, value: componentId }, { type: Path.StepTypes.SWITCH, value: 'systemProps' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName }]);

      var initialValue = generateJssyValue(component.systemProps[propName], path, file);

      // stateKey: () => /*initialValue*/
      var statePropertyAST = t.objectProperty(t.identifier(stateKey), t.arrowFunctionExpression([], initialValue));

      statePropertyASTs.push(statePropertyAST);
    });
  });

  file.activeStateSlots.forEach(function (activeStateSlots, componentId) {
    var component = file.components[componentId];
    var componentMeta = getComponentMeta(component.name, model.meta);

    if (componentMeta === null) {
      throw new Error('Failed to get metadata for component \'' + component.name + '\'');
    }

    activeStateSlots.forEach(function (stateSlot) {
      var stateSlotMeta = componentMeta.state[stateSlot];
      var stateKey = formatComponentStateSlotKey(component, stateSlot);
      var initialValue = generateJssyValue(stateSlotMeta.initialValue, null, file);

      // stateKey: () => /*initialValue*/
      var statePropertyAST = t.objectProperty(t.identifier(stateKey), initialValue);

      statePropertyASTs.push(statePropertyAST);
    });
  });

  if (statePropertyASTs.length === 0) {
    return null;
  }

  // this.state = { /*statePropertyASTs*/ }
  return t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.thisExpression(), t.identifier('state')), t.objectExpression(statePropertyASTs)));
};

module.exports = generateState;
//# sourceMappingURL=generateStateAST.js.map