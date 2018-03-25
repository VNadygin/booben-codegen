'use strict';

var _require = require('lodash'),
    forOwn = _require.forOwn;

var walkJssyValue = require('./walkJssyValue');

var _require2 = require('./names'),
    formatRouteComponentName = _require2.formatRouteComponentName,
    formatRouteIndexComponentName = _require2.formatRouteIndexComponentName;

var Path = require('./Path');

var _require3 = require('./misc'),
    normalizeRoutes = _require3.normalizeRoutes,
    parseComponentName = _require3.parseComponentName;

var _require4 = require('./constants'),
    INVALID_ID = _require4.INVALID_ID,
    FileTypes = _require4.FileTypes;

var walkComponentsTree = function walkComponentsTree(components, rootId, visitor) {
  if (rootId === INVALID_ID) return;

  var visitComponent = function visitComponent(component) {
    visitor(component);
    component.children.forEach(function (childId) {
      walkComponentsTree(components, childId, visitor);
    });
  };

  visitComponent(components[rootId]);
};

/**
 * @typedef {Object} ComponentFileModel
 * @property {number} type
 * @property {string} name
 * @property {number} routeId
 * @property {Object<number, Object>} components
 * @property {number} rootComponentId
 * @property {Map<string, Set<string>>} importComponents
 * @property {Map<string, { path: Path, actions: Array<Object> }>} handlers
 * @property {Set<number>} refs
 * @property {Map<number, Set<string>>} activeStateSlots
 * @property {Map<number, Set<string>>} propsState
 * @property {Map<number, Set<string>>} systemPropsState
 * @property {Set<string>} importProjectFunctions
 * @property {Set<string>} importBuiltinFunctions
 * @property {boolean} needRouteParams
 * @property {Set<string>} importHelpers
 * @property {Set<string>} importFiles
 * @property {boolean} usingReactRouter
 * @property {Array<ComponentFileModel>} nestedFiles
 */

/**
 *
 * @param {number} type
 * @param {string} name
 * @return {ComponentFileModel}
 */
var createFile = function createFile(type, name) {
  return {
    type: type,
    name: name,
    routeId: INVALID_ID,
    components: null,
    rootComponentId: INVALID_ID,
    importComponents: new Map(), // Map of namespace => Set of component names
    handlers: new Map(), // Map of serialized path => array of actions
    refs: new Set(), // Set of component ids
    activeStateSlots: new Map(), // Map of component id => Set of state slot names
    routePaths: new Map(), //Map of routes id => full route path
    propsState: new Map(), // Map of component id => Set of prop names
    systemPropsState: new Map(), // Map of component id => Set of prop names
    importProjectFunctions: new Set(), // Set of function names
    importBuiltinFunctions: new Set(), // Set of function names
    needRouteParams: false,
    importHelpers: new Set(), // Set of helper names
    importFiles: new Set(), // Set of file names
    usingReactRouter: false,
    nestedFiles: [],
    usingGraphQL: false,
    queries: new Map(),
    mutations: new Map(),
    css: new Map(),
    auth: null
  };
};

/**
 *
 * @param {Object} model
 * @param {ComponentFileModel} file
 * @param {Object<number, Object>} components
 * @param {number} rootComponentId
 * @return {void}
 */
var collectFileData = function collectFileData(model, file, components, rootComponentId) {
  file.components = components;
  file.rootComponentId = rootComponentId;

  walkComponentsTree(components, rootComponentId, function (component) {
    var _parseComponentName = parseComponentName(component.name),
        namespace = _parseComponentName.namespace,
        name = _parseComponentName.name;

    var style = component.style,
        id = component.id;


    if (style) {
      file.css.set(id, style);
    }

    if (namespace) {
      if (!file.importComponents.has(namespace)) {
        file.importComponents.set(namespace, new Set([name]));
      } else {
        file.importComponents.get(namespace).add(name);
      }
    } else {
      if (name === 'Outlet') {
        if (file.type !== FileTypes.ROUTE) {
          throw new Error('Found Outlet in a non-route file');
        }

        var route = model.routes[file.routeId];
        if (route.children.length > 0 || route.haveIndex) {
          file.usingReactRouter = true;
          route.children.forEach(function (childId) {
            var childRoute = model.routes[childId];
            var fileName = formatRouteComponentName(childRoute);
            file.importFiles.add(fileName);
          });

          if (route.haveIndex) {
            var fileName = formatRouteIndexComponentName(route);
            file.importFiles.add(fileName);
          }
        }
      }
    }

    var emitFile = function emitFile(name, type, components, rootComponentId) {
      var newFile = createFile(type, name);
      collectFileData(model, newFile, components, rootComponentId);
      file.nestedFiles.push(newFile);
    };

    forOwn(component.props, function (propValue, propName) {
      walkJssyValue(propValue, model, file, new Path([{ type: Path.StepTypes.COMPONENT_ID, value: component.id }, { type: Path.StepTypes.SWITCH, value: 'props' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName }]), emitFile);
    });

    forOwn(component.systemProps, function (propValue, propName) {
      walkJssyValue(propValue, model, file, new Path([{ type: Path.StepTypes.COMPONENT_ID, value: component.id }, { type: Path.StepTypes.SWITCH, value: 'systemProps' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName }]), emitFile);
    });
  });
};

/**
 * @typedef {Object} JssyProjectModel
 * @property {Object} project
 * @property {Object<string, CodegenLibMetadata>} meta
 * @property {Object<number, Object>} routes
 * @property {Array<number>} rootRoutes
 * @property {Object<string, Object>} functions
 * @property {Array<ComponentFileModel>} files
 * @property {boolean} usingGraphQL
 */

/**
 *
 * @param {Object} jssyProject
 * @param {Object<string, CodegenLibMetadata>} meta
 * @param {?DataSchema} schema
 * @return {JssyProjectModel}
 */
var buildModel = function buildModel(jssyProject, meta, schema) {
  var model = {
    project: jssyProject,
    meta: meta,
    routes: normalizeRoutes(jssyProject.routes),
    redirects: [],
    rootRoutes: jssyProject.routes.map(function (route) {
      return route.id;
    }),
    functions: jssyProject.functions,
    files: [],
    usingGraphQL: false,
    schema: schema,
    helpers: {
      openUrl: false
    }
  };

  if (model.project.graphQLEndpointURL) {
    model.usingGraphQL = true;
  }

  forOwn(model.routes, function (route) {
    if (route.redirect) {
      model.redirects.push({
        type: 'always',
        from: route.fullPath,
        to: route.redirectTo
      });
    }

    if (route.redirectAuthenticated) {
      model.redirects.push({
        type: 'hasAuth',
        from: route.fullPath,
        to: route.redirectAuthenticatedTo
      });
    }

    if (route.redirectAnonymous) {
      model.redirects.push({
        type: 'anonymous',
        from: route.fullPath,
        to: route.redirectAnonymousTo
      });
    }

    var routeFile = createFile(FileTypes.ROUTE, formatRouteComponentName(route));
    routeFile.routeId = route.id;
    collectFileData(model, routeFile, route.components, route.rootComponentId);
    route.file = routeFile;

    forOwn(model.routes, function (route) {
      routeFile.routePaths.set(route.id, route.fullPath);
    });

    model.files.push(routeFile);

    if (route.haveIndex) {
      var indexFile = createFile(FileTypes.ROUTE_INDEX, formatRouteIndexComponentName(route));

      indexFile.routeId = route.id;
      collectFileData(model, indexFile, route.components, route.indexComponentId);
      route.indexFile = indexFile;
      model.files.push(indexFile);
    }
  });

  return model;
};

module.exports = buildModel;
//# sourceMappingURL=buildModel.js.map