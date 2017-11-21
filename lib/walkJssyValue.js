const _ = require('lodash');
const Path = require('./Path');
const { parseComponentName } = require('./misc');

const visitStaticValue = (jssyValue, model, file, path) => {
  const value = jssyValue.sourceData.value;

  if (_.isArray(value)) {
    value.forEach((itemValue, index) => {
      walkJssyValue(
        itemValue,
        model,
        file,
        path.extend({ type: Path.StepTypes.ARRAY_INDEX, value: index }),
      );
    });
  } else if (_.isObject(value)) {
    _.forOwn(value, (itemValue, key) => {
      walkJssyValue(
        itemValue,
        model,
        file,
        path.extend({ type: Path.StepTypes.OBJECT_KEY, value: key }),
      );
    });
  }
};

const addActionsForHandler = (file, path, actions) => {
  const serializedPath = path.serialize();

  if (file.handlers.has(serializedPath)) {
    file.handlers.get(serializedPath).push(...actions);
  } else {
    file.handlers.set(serializedPath, actions);
  }
};

const visitStateValue = (jssyValue, model, file) => {
  const componentId = jssyValue.sourceData.componentId;
  const component = file.components[componentId];
  const stateSlot = jssyValue.sourceData.stateSlot;
  const {
    namespace: componentNamespace,
    name: componentName,
  } = parseComponentName(component.name);

  const componentMeta =
    model.meta[componentNamespace].components[componentName];

  const stateSlotMeta = componentMeta.state[stateSlot];

  if (!file.activeStateSlots.has(componentId)) {
    file.activeStateSlots.set(componentId, new Set());
  }

  file.activeStateSlots.get(componentId).add(stateSlot);

  Object.keys(componentMeta.props).forEach(propName => {
    const propMeta = componentMeta.props[propName];

    if (
      propMeta.sourceConfigs &&
      propMeta.sourceConfigs.actions &&
      propMeta.sourceConfigs.actions.updateState &&
      propMeta.sourceConfigs.actions.updateState[stateSlot]
    ) {
      const handlerPath = new Path([
        { type: Path.StepTypes.COMPONENT_ID, value: componentId },
        { type: Path.StepTypes.SWITCH, value: 'props' },
        { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName },
      ]);

      const updateStateMeta =
        propMeta.sourceConfigs.actions.updateState[stateSlot];

      addActionsForHandler(file, handlerPath, [
        {
          type: 'setState',
          params: { stateSlotMeta, updateStateMeta },
        },
      ]);
    }
  });
};

const visitAction = (action, model, file, path) => {
  if (action.type === 'method') {
    file.refs.add(action.params.componentId);

    action.params.args.forEach((argValue, index) => {
      walkJssyValue(
        argValue,
        model,
        file,
        path.extend([
          { type: Path.StepTypes.SWITCH, value: 'args' },
          { type: Path.StepTypes.METHOD_ARG, value: index },
        ]),
      );
    });
  } else if (action.type === 'prop') {
    let fileKey;
    let paramsKey;

    if (action.params.systemPropName) {
      fileKey = 'systemPropsState';
      paramsKey = 'systemPropName';
    } else {
      fileKey = 'propsState';
      paramsKey = 'propName';
    }

    if (!file[fileKey].has(action.params.componentId)) {
      file[fileKey].set(action.params.componentId, new Set());
    }

    file[fileKey].get(action.params.componentId).add(action.params[paramsKey]);

    walkJssyValue(
      action.params.value,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'value' }),
    );
  } else if (action.type === 'navigate') {
    _.forOwn(action.params.routeParams, (paramValue, paramName) => {
      walkJssyValue(
        paramValue,
        model,
        file,
        path.extend([
          { type: Path.StepTypes.SWITCH, value: 'routeParams' },
          { type: Path.StepTypes.ROUTE_PARAM_NAME, value: paramName },
        ]),
      );
    });
  } else if (action.type === 'mutation') {
    _.forOwn(action.params.args, (argValue, argName) => {
      walkJssyValue(
        argValue,
        model,
        file,
        path.extend([
          { type: Path.StepTypes.SWITCH, value: 'args' },
          { type: Path.StepTypes.MUTATION_ARG, value: argName },
        ]),
      );
    });
  } else if (action.type === 'ajax') {
    walkJssyValue(
      action.param.url,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'url' }),
    );

    walkJssyValue(
      action.param.body,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'body' }),
    );
  }

  if (action.params.successActions) {
    visitActionsList(
      action.params.successActions,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'successActions' }),
    );
  }

  if (action.params.errorActions) {
    visitActionsList(
      action.params.errorActions,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'errorActions' }),
    );
  }
};

const visitActionsList = (actions, model, file, path) => {
  actions.forEach((action, index) => {
    visitAction(
      action,
      model,
      file,
      path.extend({ type: Path.StepTypes.ACTION_INDEX, value: index }),
    );
  });
};

const visitActionsValue = (jssyValue, model, file, path) => {
  addActionsForHandler(file, path, jssyValue.sourceData.actions);

  visitActionsList(
    jssyValue.sourceData.actions,
    model,
    file,
    path.extend({ type: Path.StepTypes.SWITCH, value: 'actions' }),
  );
};

const visitFunctionArgsList = (args, model, file, path) => {
  args.forEach((argValue, index) => {
    walkJssyValue(
      argValue,
      model,
      file,
      path.extend({ type: Path.StepTypes.FUNCTION_ARG, value: index }),
    );
  });
};

const visitFunctionValue = (jssyValue, model, file, path) => {
  const funcName = jssyValue.sourceData.function;

  if (jssyValue.sourceData.functionSource === 'project') {
    file.importProjectFunctions.add(funcName);
  } else {
    file.importBuiltinFunctions.add(funcName);
  }

  visitFunctionArgsList(
    jssyValue.sourceData.args,
    model,
    file,
    path.extend({ type: Path.StepTypes.SWITCH, value: 'args' }),
  );
};

const visitRouteParamsValue = file => {
  file.needRouteParams = true;
};

const walkJssyValue = (jssyValue, model, file, path) => {
  switch (jssyValue.source) {
    case 'static':
      visitStaticValue(jssyValue, model, file, path);
      break;
    case 'const':
      break;
    case 'data':
      break;
    case 'actions':
      visitActionsValue(jssyValue, model, file, path);
      break;
    case 'routeParams':
      visitRouteParamsValue(file);
      break;
    case 'state':
      visitStateValue(jssyValue, model, file);
      break;
    case 'function':
      visitFunctionValue(jssyValue, model, file, path);
      break;
    case 'designer':
      break;
    case 'ownerProp':
      break;
    case 'actionArg':
      break;
    default:
      throw new Error(`Got JssyValue with unknown source: ${jssyValue.source}`);
  }
};

module.exports = walkJssyValue;
