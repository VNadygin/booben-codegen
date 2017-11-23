const { forOwn } = require('lodash');
const walkJssyValue = require('./walkJssyValue');

const {
  formatRouteComponentName,
  formatRouteIndexComponentName,
} = require('./names');

const Path = require('./Path');
const { INVALID_ID } = require('./constants');

const concatPath = (prefix, path) => {
  if (prefix === '') return path;
  if (prefix === '/') return `/${path}`;
  return `${prefix}/${path}`;
};

const normalizeComponents = (
  rootComponent,
  accumulator = {},
  parentId = INVALID_ID
) => {
  if (rootComponent === null) {
    return accumulator;
  }

  accumulator[rootComponent.id] = {
    ...rootComponent,
    parentId,
    children: rootComponent.children.map(childComponent => childComponent.id),
  };

  rootComponent.children.forEach(childComponent =>
    normalizeComponents(childComponent, accumulator, rootComponent.id)
  );

  return accumulator;
};

const normalizeRoutes = (
  routes,
  accumulator = {},
  currentFullPath = '',
  parentId = INVALID_ID
) => {
  const visitRoute = route => {
    const fullPath = concatPath(currentFullPath, routes.path);

    accumulator[route.id] = {
      ...route,
      parentId,
      fullPath,
      components: {
        ...normalizeComponents(route.component),
        ...normalizeComponents(route.indexComponent),
      },
      rootComponentId:
        route.component !== null ? route.component.id : INVALID_ID,
      indexComponentId:
        route.indexComponent !== null ? route.indexComponent.id : INVALID_ID,
      children: route.children.map(childRoute => childRoute.id),
    };

    normalizeRoutes(route.children, accumulator, fullPath, route.id);
  };

  routes.forEach(visitRoute);

  return accumulator;
};

const walkComponentsTree = (components, rootId, visitor) => {
  if (rootId === INVALID_ID) return;

  const visitComponent = component => {
    visitor(component);
    component.children.forEach(childId => {
      walkComponentsTree(components, childId, visitor);
    });
  };

  visitComponent(components[rootId]);
};

/**
 * @typedef {Object} ComponentFileModel
 * @property {string} type
 * @property {string} name
 * @property {number} routeId
 * @property {Object<number, Object>} components
 * @property {number} rootComponentId
 * @property {Map<string, { path: Path, actions: Array<Object> }>} handlers
 * @property {Set<number>} refs
 * @property {Map<number, Set<string>>} activeStateSlots
 * @property {Map<number, Set<string>>} propsState
 * @property {Map<number, Set<string>>} systemPropsState
 * @property {Set<string>} importProjectFunctions
 * @property {Set<string>} importBuiltinFunctions
 * @property {boolean} needRouteParams
 * @property {Set<string>} importHelpers
 */

/**
 *
 * @param {string} type
 * @param {string} name
 * @return {ComponentFileModel}
 */
const createFile = (type, name) => ({
  type,
  name,
  routeId: INVALID_ID,
  components: null,
  rootComponentId: INVALID_ID,
  handlers: new Map(), // Map of serialized path => array of actions
  refs: new Set(), // Set of component ids
  activeStateSlots: new Map(), // Map of component id => Set of state slot names
  propsState: new Map(), // Map of component id => Set of prop names
  systemPropsState: new Map(), // Map of component id => Set of prop names
  importProjectFunctions: new Set(), // Set of function names
  importBuiltinFunctions: new Set(), // Set of function names
  needRouteParams: false,
  importHelpers: new Set(),
});

const collectFileData = (model, file, components, rootComponentId) => {
  file.components = components;
  file.rootComponentId = rootComponentId;

  walkComponentsTree(components, rootComponentId, component => {
    forOwn(component.props, (propValue, propName) => {
      walkJssyValue(
        propValue,
        model,
        file,
        new Path([
          { type: Path.StepTypes.COMPONENT_ID, value: component.id },
          { type: Path.StepTypes.SWITCH, value: 'props' },
          { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName },
        ])
      );
    });

    forOwn(component.systemProps, (propValue, propName) => {
      walkJssyValue(
        propValue,
        model,
        file,
        new Path([
          { type: Path.StepTypes.COMPONENT_ID, value: component.id },
          { type: Path.StepTypes.SWITCH, value: 'systemProps' },
          { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName },
        ])
      );
    });
  });
};

const buildModel = (jssyProject, meta) => {
  const model = {
    meta,
    routes: normalizeRoutes(jssyProject.routes),
    functions: jssyProject.functions,
    files: [],
    usingGraphQL: false,
  };

  forOwn(model.routes, route => {
    const routeFile = createFile('route', formatRouteComponentName(route));
    routeFile.routeId = route.id;
    collectFileData(model, routeFile, route.components, route.rootComponentId);
    route.file = routeFile;
    model.files.push(routeFile);

    if (route.haveIndex) {
      const indexFile = createFile(
        'routeIndex',
        formatRouteIndexComponentName(route)
      );

      indexFile.routeId = route.id;
      collectFileData(
        model,
        indexFile,
        route.components,
        route.indexComponentId
      );
      route.indexFile = indexFile;
      model.files.push(indexFile);
    }
  });

  return model;
};

module.exports = buildModel;
