/**
 * @author Dmitriy Bizyaev
 */

exports.parseComponentName = componentName => {
  let [namespace, name] = componentName.split('.');

  if (!name) {
    name = namespace;
    namespace = '';
  }

  return { namespace, name };
};

exports.formatComponentName = (namespace, name) => {
  if (!namespace) {
    return name;
  }

  return `${namespace}.${name}`;
};
