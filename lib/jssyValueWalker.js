const _ = require('lodash');
const { jssyValue } = require('./jssyValue');

const walkStaticValue = (jssyProjectValue, model, rKey, cKey, pKey) => {
  const value = jssyProjectValue.sourceData.value;
  
  switch (true) {
    case _.isArray(value):
      value.map(walkValueWalker, model, rKey, cKey, pKey);
      break;
    case _.isObject(value):
      Object.keys(value).forEach(key => {
        walkValueWalker(value[key], model, rKey, cKey, pKey);
      });
      break;
    default: break;
  }
};

const waltStateValue = (jssyProjectValue, model, rKey, cKey) => {
  const node = jssyProjectValue;
  const selectRoute = model.route[rKey];
  const componentId = node.sourceData.componentId;
  const stateSlot = node.sourceData.stateSlot;
  const componentNamespace = selectRoute.component[componentId].name
    .replace(/(?=\.).*/, '');
  const componentName = selectRoute.component[componentId].name
    .replace(/.*(?=\.)./, '');
  const selectMeta = model.meta[componentNamespace].components[componentName];
  const defaultValue = jssyValue(selectMeta.state[stateSlot].initialValue);

  const stateKey = `_Component${componentId}State_${stateSlot}`;

  model.route[rKey].state[stateKey] = {
    componentId,
    propName: stateSlot,
    defaultValue,
  };
  Object.keys(selectMeta.props).forEach(mKey => {
    if (
      selectMeta.props[mKey].sourceConfigs &&
      selectMeta.props[mKey].sourceConfigs.actions &&
      selectMeta.props[mKey].sourceConfigs.actions.updateState &&
      selectMeta.props[mKey].sourceConfigs.actions.updateState[stateSlot]
    ) {
      const handlerName = `${mKey}${cKey}`;
      model.route[rKey].handlers.push({
        handlerName,
        actions: [{
          type: 'setState',
          params: {
            stateKey,
            value: selectMeta.props[mKey].sourceConfigs.actions.updateState[stateSlot],
          },
        }],
      });
    }
  });
};

const walkActionType = (action, model, rKey, cKey, pKey) => {
  if (action.type === 'method') {
    model.route[rKey].refs[action.params.componentId] = `_Component${action.params.componentId}Ref`;
    action.params.args.forEach(arg => {
      walkValueWalker(arg, model, rKey, cKey, pKey);
    });
  }
  if (action.type === 'prop') {
    const stateKey = `_Component${action.params.componentId}State_${action.params.propName}`;
    model.route[rKey].state[stateKey] = {
      ...action.params,
      defaultValue: jssyValue(model.route[rKey].component[action.params.componentId].props[action.params.propName]),
    };
    walkValueWalker(action.params.value, model, rKey, cKey, pKey);
  }
  if (action.type === 'navigate')
    walkValueWalker(action.params.routeParams.param);
  
  if (action.type === 'mutation') {
    Object.keys(action.params.args).forEach(key => {
      walkValueWalker(action.params.args[key], model, rKey, cKey, pKey);
    });
    action.params.successActions.forEach(successAction => {
      walkActionType(successAction, model, rKey, cKey, pKey);
    });
    action.params.errorActions.forEach(errorAction => {
      walkActionType(errorAction, model, rKey, cKey, pKey);
    });
  }
  if (action.type === 'ajax') {
    walkActionValue(action.param.url);
    walkActionValue(action.param.body);
    action.params.successActions.forEach(successAction => {
      walkActionType(successAction, model, rKey, cKey, pKey);
    });
    action.params.errorActions.forEach(errorAction => {
      walkActionType(errorAction, model, rKey, cKey, pKey);
    });
  }
};

const walkActionValue = (jssyProjectValue, model, rKey, cKey, pKey) => {
  const handlerName = `${pKey}${cKey}`;
  model.route[rKey].handlers.push({
    handlerName,
    actions: jssyProjectValue.sourceData.actions,
  });
  jssyProjectValue.sourceData.actions.forEach(action => {
    walkActionType(action, model, rKey, cKey, pKey);
  });
};

const waltFunctionValue = (jssyProjectValue, model, rKey, cKey, pKey) => {
  const funcName = jssyProjectValue.sourceData.function;
  
  model.route[rKey].functions[funcName] = model.functions[funcName];
  jssyProjectValue.sourceData.args.forEach(arg => {
    walkValueWalker(arg, model, rKey, cKey, pKey);
  });
};

const walkValueWalker = (jssyProjectValue, model, rKey, cKey, pKey) => {
  switch (jssyProjectValue.source) {
    case 'static':
      walkStaticValue(jssyProjectValue, model, rKey, cKey, pKey);
      break;
    case 'const':
      break;
    case 'data':
      break;
    case 'actions':
      walkActionValue(jssyProjectValue, model, rKey, cKey, pKey);
      break;
    case 'routeParams':
      break;
    case 'state':
      waltStateValue(jssyProjectValue, model, rKey, cKey, pKey);
      break;
    case 'function':
      waltFunctionValue(jssyProjectValue, model, rKey, cKey, pKey);
      break;
    case 'designer':
      break;
    case 'ownerProp':
      break;
    case 'actionArg':
      break;
    default: throw new Error('Something went wrong');
  }
};

module.exports = walkValueWalker;
