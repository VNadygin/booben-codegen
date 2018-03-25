/**
 * @author Dmitriy Bizyaev
 */

'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('./constants'),
    INVALID_ID = _require.INVALID_ID;

var concatPath = function concatPath(prefix, path) {
  if (prefix === '') return path;
  if (prefix === '/') return '/' + path;
  return prefix + '/' + path;
};

var normalizeComponents = function normalizeComponents(rootComponent) {
  var accumulator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var parentId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : INVALID_ID;

  if (rootComponent === null) {
    return accumulator;
  }

  accumulator[rootComponent.id] = _extends({}, rootComponent, {
    parentId: parentId,
    children: rootComponent.children.map(function (childComponent) {
      return childComponent.id;
    })
  });

  rootComponent.children.forEach(function (childComponent) {
    return normalizeComponents(childComponent, accumulator, rootComponent.id);
  });

  return accumulator;
};

var normalizeRoutes = function normalizeRoutes(routes) {
  var accumulator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var currentFullPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var parentId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : INVALID_ID;

  var visitRoute = function visitRoute(route) {
    var fullPath = concatPath(currentFullPath, route.path);

    accumulator[route.id] = _extends({}, route, {
      parentId: parentId,
      fullPath: fullPath,
      components: _extends({}, normalizeComponents(route.component), normalizeComponents(route.indexComponent)),
      rootComponentId: route.component !== null ? route.component.id : INVALID_ID,
      indexComponentId: route.indexComponent !== null ? route.indexComponent.id : INVALID_ID,
      children: route.children.map(function (childRoute) {
        return childRoute.id;
      })
    });

    normalizeRoutes(route.children, accumulator, fullPath, route.id);
  };

  routes.forEach(visitRoute);

  return accumulator;
};

var parseComponentName = function parseComponentName(componentName) {
  var _componentName$split = componentName.split('.'),
      _componentName$split2 = _slicedToArray(_componentName$split, 2),
      namespace = _componentName$split2[0],
      name = _componentName$split2[1];

  if (!name) {
    name = namespace;
    namespace = '';
  }

  return { namespace: namespace, name: name };
};

var formatComponentName = function formatComponentName(namespace, name) {
  if (!namespace) {
    return name;
  }

  return namespace + '.' + name;
};

// TODO: Move metadata for builtin components to jssy-common and import it here
var miscMeta = { components: {} };
var HTMLMeta = { components: {} };

var getComponentMeta = function getComponentMeta(componentName, meta) {
  var _parseComponentName = parseComponentName(componentName),
      namespace = _parseComponentName.namespace,
      name = _parseComponentName.name;

  var components = void 0;

  if (namespace === '') components = miscMeta.components;else if (namespace === 'HTML') components = HTMLMeta.components;else components = meta[namespace] ? meta[namespace].components : null;

  return components ? components[name] || null : null;
};

/**
 *
 * @param {Object} meta
 * @return {string}
 */
var getContainerStyle = function getContainerStyle(meta) {
  var combinedStyle = Object.keys(meta).reduce(function (acc, cur) {
    return Object.assign(acc, meta[cur].containerStyle || {});
  }, {});

  return Object.keys(combinedStyle).map(function (prop) {
    return prop + ':' + combinedStyle[prop];
  }).join(';');
};

module.exports = {
  normalizeComponents: normalizeComponents,
  normalizeRoutes: normalizeRoutes,
  parseComponentName: parseComponentName,
  formatComponentName: formatComponentName,
  getComponentMeta: getComponentMeta,
  getContainerStyle: getContainerStyle
};
//# sourceMappingURL=misc.js.map