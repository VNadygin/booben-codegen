/**
 * @author Dmitriy Bizyaev
 */

'use strict';

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
  parseComponentName,
  formatComponentName,
  getComponentMeta,
  getContainerStyle,
};
