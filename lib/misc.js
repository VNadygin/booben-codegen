/**
 * @author Dmitriy Bizyaev
 */

'use strict';

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
    const fullPath = concatPath(currentFullPath, route.path);

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

const parseComponentName = componentName => {
  let [namespace, name] = componentName.split('.');

  if (!name) {
    name = namespace;
    namespace = '';
  }

  return { namespace, name };
};

const formatComponentName = (namespace, name) => {
  if (!namespace) {
    return name;
  }

  return `${namespace}.${name}`;
};

// TODO: Move metadata for builtin components to jssy-common and import it here
const miscMeta = { components: {} };
const HTMLMeta = { components: {} };

const getComponentMeta = (componentName, meta) => {
  const { namespace, name } = parseComponentName(componentName);
  let components;

  if (namespace === '') components = miscMeta.components;
  else if (namespace === 'HTML') components = HTMLMeta.components;
  else components = meta[namespace] ? meta[namespace].components : null;

  return components ? components[name] || null : null;
};

/**
 *
 * @param {Object} meta
 * @return {string}
 */
const getContainerStyle = meta => {
  const combinedStyle = Object.keys(meta).reduce(
    (acc, cur) => Object.assign(acc, meta[cur].containerStyle || {}),
    {}
  );

  return Object.keys(combinedStyle)
    .map(prop => `${prop}:${combinedStyle[prop]}`)
    .join(';');
};

module.exports = {
  normalizeComponents,
  normalizeRoutes,
  parseComponentName,
  formatComponentName,
  getComponentMeta,
  getContainerStyle,
};
