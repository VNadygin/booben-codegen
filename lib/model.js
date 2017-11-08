const walkValueWalker = require('./jssyValueWalker');

const concatPath = (prefix, path) => {
  if (prefix === '') return path;
  if (prefix === '/') return `/${path}`;
  return `${prefix}/${path}`;
};

const normalizeRoute = (node, accumulator = {}, currentFullPath = '') => {
  const fullPath = concatPath(currentFullPath, node.path);
  accumulator[node.id] = {
    ...node,
    children: node.children.map(n => n.id),
    fullPath,
  };
  node.children.forEach(c => normalizeRoute(c, accumulator, fullPath));
  return accumulator;
};

const normalizedComponent = (node, accumulator = {}) => {
  accumulator[node.id] = { ...node, children: node.children.map(n => n.id) };
  node.children.forEach(c => normalizedComponent(c, accumulator));
  return accumulator;
};

const getModel = (jssyProject, meta) => {
  let routes = {};
  const model = {
    meta,
    route: {},
  };
  jssyProject.routes.forEach(r => {
    routes = {
      ...routes,
      ...normalizeRoute(r),
    };
  });
  Object.keys(routes).forEach(key => {
    routes[key].unnomalizeComponent = routes[key].component;
    routes[key].component = normalizedComponent(routes[key].component);
  });
  Object.keys(routes).forEach(rKey => {
    const selectRoute = routes[rKey];
    model.functions = jssyProject.functions;
    model.route[rKey] = {};
    model.route[rKey].componentName = `Component${rKey}`;
    model.route[rKey].unnomalizeComponent = selectRoute.unnomalizeComponent;
    model.route[rKey].component = selectRoute.component;
    model.route[rKey].handlers = [];
    model.route[rKey].refs = {};
    model.route[rKey].state = {};
    model.route[rKey].functions = {};
    Object.keys(selectRoute.component).forEach(cKey => {
      const selectComponent = selectRoute.component[cKey];
      const props = selectComponent.props;
      Object.keys(props).forEach(pKey => {
        const selectProp = props[pKey];
        walkValueWalker(selectProp, model, rKey, cKey, pKey);
      });
    });
  });
  return model;
};
module.exports = getModel;
