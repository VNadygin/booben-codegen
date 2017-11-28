'use strict';

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
 * @return {JSXAttribute}
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
 * @return {JSXAttribute}
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

/**
 *
 * @param {Object} textComponent
 * @param {ComponentFileModel} file
 * @return {JSXText|JSXExpressionContainer}
 */
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
 * @param {Object} outletComponent
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @return {JSXElement}
 */
const generateRouterSwitchElement = (outletComponent, file, model) => {
  const route = model.routes[file.routeId];

  if (route.children.length === 0) {
    return null;
  }

  const childRouteElements = route.children.map(childRouteId => {
    const childRoute = model.routes[childRouteId];
    const childRouteComponentName = childRoute.file.name;

    return t.jSXElement(
      t.jSXOpeningElement(
        t.jSXIdentifier('Route'),
        [
          t.jSXAttribute(
            t.jSXIdentifier('path'),
            t.stringLiteral(childRoute.fullPath)
          ),
          t.jSXAttribute(
            t.jSXIdentifier('component'),
            t.jSXExpressionContainer(t.identifier(childRouteComponentName))
          ),
        ],
        true
      ),
      null,
      []
    );
  });

  if (route.haveIndex) {
    const indexRouteFile = route.indexFile;
    const indexRouteComponentName = indexRouteFile.name;

    childRouteElements.unshift(
      t.jSXElement(
        t.jSXOpeningElement(
          t.jSXIdentifier('Route'),
          [
            t.jSXAttribute(
              t.jSXIdentifier('path'),
              t.stringLiteral(route.fullPath)
            ),
            t.jSXAttribute(t.jSXIdentifier('exact')),
            t.jSXAttribute(
              t.jSXIdentifier('component'),
              t.jSXExpressionContainer(t.identifier(indexRouteComponentName))
            ),
          ],
          true
        ),
        null,
        []
      )
    );
  }

  return t.jSXElement(
    t.jSXOpeningElement(t.jSXIdentifier('Switch'), []),
    t.jSXClosingElement(t.jSXIdentifier('Switch')),
    childRouteElements
  );
};

/**
 *
 * @param {Object} component
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @return {JSXElement|JSXText|JSXExpressionContainer}
 */
const generateJSXElement = (component, file, model) => {
  const { id, name: componentName, props, children } = component;
  const { namespace, name } = parseComponentName(componentName);

  if (namespace === '') {
    if (name === 'Text') {
      return generateTextElement(component, file);
    } else if (name === 'List') {
      // TODO: Generate AST for List
      return null;
    } else if (name === 'Outlet') {
      return generateRouterSwitchElement(component, file, model);
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

  const childElements = [];
  children.forEach(childId => {
    const childElement = generateJSXElement(
      file.components[childId],
      file,
      model
    );

    if (childElement !== null) {
      childElements.push(childElement);
    }
  });

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
 * @param {JssyProjectModel} model
 * @return {JSXElement}
 */
const generateJSXAST = (file, model) => {
  const rootComponent = file.components[file.rootComponentId];
  return generateJSXElement(rootComponent, file, model);
};

module.exports = generateJSXAST;
