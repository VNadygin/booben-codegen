const t = require('babel-types');
const generateJssyValue = require('./generateJssyValueAST');
const Path = require('./Path');
const { getComponentMeta } = require('./misc');

const {
  formatStateKeyForProp,
  formatComponentStateSlotKey,
} = require('./names');

/**
 *
 * @param {ComponentFileModel} file
 * @param {Object} model
 * @return {Object}
 */
const generateState = (file, model) => {
  const statePropertyASTs = [];

  file.propsState.forEach((propNames, componentId) => {
    const component = file.components[componentId];

    propNames.forEach(propName => {
      const stateKey = formatStateKeyForProp(component, propName, false);
      const path = new Path([
        { type: Path.StepTypes.COMPONENT_ID, value: componentId },
        { type: Path.StepTypes.SWITCH, value: 'props' },
        { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName },
      ]);

      const initialValue = generateJssyValue(
        component.props[propName],
        path,
        file
      );

      // stateKey: () => /*initialValue*/
      const statePropertyAST = t.objectProperty(
        t.identifier(stateKey),
        t.arrowFunctionExpression([], initialValue)
      );

      statePropertyASTs.push(statePropertyAST);
    });
  });

  file.systemPropsState.forEach((propNames, componentId) => {
    const component = file.components[componentId];

    propNames.forEach(propName => {
      const stateKey = formatStateKeyForProp(component, propName, true);
      const path = new Path([
        { type: Path.StepTypes.COMPONENT_ID, value: componentId },
        { type: Path.StepTypes.SWITCH, value: 'systemProps' },
        { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName },
      ]);

      const initialValue = generateJssyValue(
        component.systemProps[propName],
        path,
        file
      );

      // stateKey: () => /*initialValue*/
      const statePropertyAST = t.objectProperty(
        t.identifier(stateKey),
        t.arrowFunctionExpression([], initialValue)
      );

      statePropertyASTs.push(statePropertyAST);
    });
  });

  file.activeStateSlots.forEach((activeStateSlots, componentId) => {
    const component = file.components[componentId];
    const componentMeta = getComponentMeta(component.name, model.meta);

    if (componentMeta === null) {
      throw new Error(
        `Failed to get metadata for component '${component.name}'`
      );
    }

    activeStateSlots.forEach(stateSlot => {
      const stateSlotMeta = componentMeta.state[stateSlot];
      const stateKey = formatComponentStateSlotKey(component, stateSlot);
      const initialValue = generateJssyValue(
        stateSlotMeta.initialValue,
        null,
        file
      );

      // stateKey: () => /*initialValue*/
      const statePropertyAST = t.objectProperty(
        t.identifier(stateKey),
        initialValue
      );

      statePropertyASTs.push(statePropertyAST);
    });
  });

  // this.state = { /*statePropertyASTs*/ }
  return t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(t.thisExpression(), t.identifier('state')),
      t.objectExpression(statePropertyASTs)
    )
  );
};

module.exports = generateState;
