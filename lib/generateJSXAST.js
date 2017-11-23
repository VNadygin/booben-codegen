const t = require('babel-types');
const generateJssyValueAST = require('./generateJssyValueAST');
const Path = require('./Path');
const { parseComponentName } = require('./misc');

const {
  formatComponentSaveRefMethodName,
  formatStateKeyForProp,
} = require('./names');

/**
 *
 * @param {string} methodName
 * @return {Object}
 */
const generateRefAttribute = methodName =>
  t.jSXAttribute(
    t.jSXIdentifier('ref'),
    t.jSXExpressionContainer(
      t.memberExpression(t.thisExpression, t.identifier(methodName))
    )
  );

/**
 *
 * @param {string} propName
 * @param {Object} component
 * @param {ComponentFileModel} file
 * @return {Object}
 */
const generateAttribute = (propName, component, file) => {
  if (file.propsState.has(propName)) {
    const stateKey = formatStateKeyForProp(component, propName, false);

    // /*propName*/={this.state./*stateKey*/()}
    return t.jSXAttribute(
      t.jSXIdentifier(propName),
      t.jSXExpressionContainer(
        t.callExpression(
          t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier('state')),
            t.identifier(stateKey)
          ),
          []
        )
      )
    );
  } else {
    const path = new Path([
      { type: Path.StepTypes.COMPONENT_ID, value: component.id },
      { type: Path.StepTypes.SWITCH, value: 'props' },
      { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName },
    ]);

    const valueExpression = generateJssyValueAST(
      component.props[propName],
      path,
      file
    );

    if (t.isStringLiteral(valueExpression)) {
      // /*propName*/="/*valueExpression*/"
      return t.jSXAttribute(t.jSXIdentifier(propName), valueExpression);
    } else {
      // /*propName*/={/*valueExpression*/}
      return t.jSXAttribute(
        t.jSXIdentifier(propName),
        t.jSXExpressionContainer(valueExpression)
      );
    }
  }
};

const generateTextElement = (textComponent, file) => {
  const path = new Path([
    { type: Path.StepTypes.COMPONENT_ID, value: textComponent.id },
    { type: Path.StepTypes.SWITCH, value: 'props' },
    { type: Path.StepTypes.COMPONENT_PROP_NAME, value: 'text' },
  ]);

  const textAST = generateJssyValueAST(textComponent.props.text, path, file);

  if (t.isStringLiteral(textAST)) {
    return t.jSXText(textAST.value);
  } else {
    return t.jSXExpressionContainer(textAST);
  }
};

/**
 *
 * @param {Object} component
 * @param {ComponentFileModel} file
 * @return {Object}
 */
const generateJSXElement = (component, file) => {
  const { id, name: componentName, props, children } = component;
  const { namespace, name } = parseComponentName(componentName);

  if (namespace === '') {
    if (name === 'Text') {
      return generateTextElement(component, file);
    } else if (name === 'List') {
      // TODO: Generate AST for List
      return null;
    } else if (name === 'Outlet') {
      // TODO: Generate AST for Outlet
      return null;
    } else {
      throw new Error(`Unknown pseudo-component: ${name}`);
    }
  }

  const attributes = Object.keys(props).map(propName => {
    return generateAttribute(propName, component, file);
  });

  if (file.refs.has(id)) {
    const methodName = formatComponentSaveRefMethodName(component);
    attributes.push(generateRefAttribute(methodName));
  }

  const childElements = children.map(childId =>
    generateJSXElement(file.components[childId], file)
  );

  const isSelfClosing = childElements.length === 0;

  return t.jSXElement(
    t.jSXOpeningElement(t.jSXIdentifier(name), attributes, isSelfClosing),
    isSelfClosing ? null : t.jSXClosingElement(t.jSXIdentifier(name)),
    childElements
  );
};

/**
 *
 * @param {ComponentFileModel} file
 * @return {Object}
 */
const generateJSXAST = file => {
  const rootComponent = file.components[file.rootComponentId];
  return generateJSXElement(rootComponent, file);
};

module.exports = generateJSXAST;
