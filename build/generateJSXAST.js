'use strict';

var t = require('babel-types');
var generateJssyValueAST = require('./generateJssyValueAST');
var Path = require('./Path');

var _require = require('./misc'),
    parseComponentName = _require.parseComponentName;

var _require2 = require('./constants'),
    INVALID_ID = _require2.INVALID_ID;

var _require3 = require('./names'),
    formatComponentSaveRefMethodName = _require3.formatComponentSaveRefMethodName,
    formatStateKeyForProp = _require3.formatStateKeyForProp,
    formatDesignedComponentName = _require3.formatDesignedComponentName,
    formatComponentStateSlotKey = _require3.formatComponentStateSlotKey,
    formatStyleClassName = _require3.formatStyleClassName;

/**
 *
 * @param {string} methodName
 * @return {JSXAttribute}
 */


var generateRefAttribute = function generateRefAttribute(methodName) {
  return t.jSXAttribute(t.jSXIdentifier('ref'), t.jSXExpressionContainer(t.memberExpression(t.thisExpression, t.identifier(methodName))));
};

var generateStateAttribute = function generateStateAttribute(propName, stateKey) {
  return t.jSXAttribute(t.jSXIdentifier(propName), t.jSXExpressionContainer(t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('state')), t.identifier(stateKey))));
};

var generateCssAttribute = function generateCssAttribute(name) {
  return t.jSXAttribute(t.jSXIdentifier('className'), t.stringLiteral(name));
};

/**
 *
 * @param {string} propName
 * @param {Object} component
 * @param {ComponentFileModel} file
 * @return {JSXAttribute}
 */
var generateAttribute = function generateAttribute(propName, component, file, model) {
  var propFromState = file.propsState.get(component.id);
  if (propFromState && propFromState.has(propName)) {
    var stateKey = formatStateKeyForProp(component, propName, false);

    // /*propName*/={this.state./*stateKey*/()}
    return t.jSXAttribute(t.jSXIdentifier(propName), t.jSXExpressionContainer(t.callExpression(t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('state')), t.identifier(stateKey)), [])));
  } else {
    var path = new Path([{ type: Path.StepTypes.COMPONENT_ID, value: component.id }, { type: Path.StepTypes.SWITCH, value: 'props' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName }]);

    var valueExpression = generateJssyValueAST(component.props[propName], path, file, model);

    if (t.isStringLiteral(valueExpression)) {
      // /*propName*/="/*valueExpression*/"
      return t.jSXAttribute(t.jSXIdentifier(propName), valueExpression);
    } else {
      // /*propName*/={/*valueExpression*/}
      return t.jSXAttribute(t.jSXIdentifier(propName), t.jSXExpressionContainer(valueExpression));
    }
  }
};

/**
 *
 * @param {Object} textComponent
 * @param {ComponentFileModel} file
 * @param {boolean} wrap
 * @return {JSXText|JSXExpressionContainer|Expression}
 */
var generateText = function generateText(textComponent, file, wrap) {
  if (!textComponent.props.text) {
    return null;
  }

  var path = new Path([{ type: Path.StepTypes.COMPONENT_ID, value: textComponent.id }, { type: Path.StepTypes.SWITCH, value: 'props' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: 'text' }]);

  var textAST = generateJssyValueAST(textComponent.props.text, path, file);

  if (wrap) {
    if (t.isStringLiteral(textAST)) {
      return t.jSXText(textAST.value);
    } else {
      return t.jSXExpressionContainer(textAST);
    }
  } else {
    return textAST;
  }
};

/**
 *
 * @param {Object} outletComponent
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @return {JSXElement}
 */
var generateRouterSwitchElement = function generateRouterSwitchElement(outletComponent, file, model) {
  var route = model.routes[file.routeId];

  if (route.children.length === 0) {
    return null;
  }

  var childRouteElements = route.children.map(function (childRouteId) {
    var childRoute = model.routes[childRouteId];
    var childRouteComponentName = childRoute.file.name;

    return t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier('Route'), [t.jSXAttribute(t.jSXIdentifier('path'), t.stringLiteral(childRoute.fullPath)), t.jSXAttribute(t.jSXIdentifier('component'), t.jSXExpressionContainer(t.identifier(childRouteComponentName)))], true), null, []);
  });

  if (route.haveIndex) {
    var indexRouteFile = route.indexFile;
    var indexRouteComponentName = indexRouteFile.name;

    childRouteElements.unshift(t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier('Route'), [t.jSXAttribute(t.jSXIdentifier('path'), t.stringLiteral(route.fullPath)), t.jSXAttribute(t.jSXIdentifier('exact')), t.jSXAttribute(t.jSXIdentifier('component'), t.jSXExpressionContainer(t.identifier(indexRouteComponentName)))], true), null, []));
  }

  return t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier('Switch'), []), t.jSXClosingElement(t.jSXIdentifier('Switch')), childRouteElements);
};

/**
 *
 * @param {Object} listComponent
 * @param {ComponentFileModel} file
 * @param {boolean} wrap
 * @return {JSXExpressionContainer|Expression}
 */
var generateList = function generateList(listComponent, file, wrap) {
  if (!listComponent.props.data || !listComponent.props.component) {
    return null;
  }

  var dataPropPath = new Path([{ type: Path.StepTypes.COMPONENT_ID, value: listComponent.id }, { type: Path.StepTypes.SWITCH, value: 'props' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: 'data' }]);

  var itemComponentPropPath = new Path([{ type: Path.StepTypes.COMPONENT_ID, value: listComponent.id }, { type: Path.StepTypes.SWITCH, value: 'props' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: 'component' }]);

  var itemComponentName = formatDesignedComponentName(itemComponentPropPath);

  // /* dataValue */.map((item, idx) => </* ComponentName */ key={idx} item={item} />)
  var expression = t.callExpression(t.memberExpression(generateJssyValueAST(listComponent.props.data, dataPropPath, file), t.identifier('map')), [t.arrowFunctionExpression([t.identifier('item'), t.identifier('idx')], t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier(itemComponentName), [t.jSXAttribute(t.jSXIdentifier('key'), t.jSXExpressionContainer(t.identifier('idx'))), t.jSXAttribute(t.jSXIdentifier('item'), t.jSXExpressionContainer(t.identifier('item')))], true), null, []), false)]);

  return wrap ? t.jSXExpressionContainer(expression) : expression;
};

/**
 *
 * @param {Object} component
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @return {JSXElement|JSXText|JSXExpressionContainer}
 */
var generateJSXElement = function generateJSXElement(component, file, model) {
  if (!component) return t.nullLiteral();
  var id = component.id,
      componentName = component.name,
      props = component.props,
      children = component.children;

  var _parseComponentName = parseComponentName(componentName),
      namespace = _parseComponentName.namespace,
      name = _parseComponentName.name;

  if (namespace === '') {
    var isRootComponent = component.parentId === INVALID_ID;

    if (name === 'Text') {
      return generateText(component, file, !isRootComponent);
    } else if (name === 'List') {
      return generateList(component, file, !isRootComponent);
    } else if (name === 'Outlet') {
      return generateRouterSwitchElement(component, file, model);
    } else {
      throw new Error('Unknown pseudo-component: ' + name);
    }
  }

  var attributes = Object.keys(props).map(function (propName) {
    return generateAttribute(propName, component, file, model);
  });

  if (file.css.has(id)) {
    var _name = formatStyleClassName(file.name, id);
    attributes.push(generateCssAttribute(_name));
  }

  if (file.refs.has(id)) {
    var methodName = formatComponentSaveRefMethodName(component);
    attributes.push(generateRefAttribute(methodName));
  }

  if (file.activeStateSlots.has(id)) {
    var stateSlots = file.activeStateSlots.get(id);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = stateSlots.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var propName = _step.value;

        var stateKey = formatComponentStateSlotKey(component, propName);
        attributes.push(generateStateAttribute(propName, stateKey));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  var childElements = [];
  children.forEach(function (childId) {
    var childElement = generateJSXElement(file.components[childId], file, model);

    if (childElement !== null) {
      childElements.push(childElement);
    }
  });

  var isSelfClosing = childElements.length === 0;

  return t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier(name), attributes, isSelfClosing), isSelfClosing ? null : t.jSXClosingElement(t.jSXIdentifier(name)), childElements);
};

/**
 *
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @return {JSXElement}
 */
var generateJSXAST = function generateJSXAST(file, model) {
  var rootComponent = file.components[file.rootComponentId];
  return generateJSXElement(rootComponent, file, model);
};

module.exports = generateJSXAST;
//# sourceMappingURL=generateJSXAST.js.map