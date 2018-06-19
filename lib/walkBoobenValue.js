'use strict';

const _ = require('lodash');
const Path = require('./Path');
const { formatDesignedComponentName } = require('./names');
const { normalizeComponents, parseComponentName } = require('./misc');
const { FileTypes } = require('./constants');
const generateBoobenValueAST = require('./generateBoobenValueAST');

const visitStaticValue = (boobenValue, model, file, path) => {
  const value = boobenValue.sourceData.value;

  if (_.isArray(value)) {
    value.forEach((itemValue, index) => {
      walkBoobenValue(
        itemValue,
        model,
        file,
        path.extend({ type: Path.StepTypes.ARRAY_INDEX, value: index })
      );
    });
  } else if (_.isObject(value)) {
    _.forOwn(value, (itemValue, key) => {
      walkBoobenValue(
        itemValue,
        model,
        file,
        path.extend({ type: Path.StepTypes.OBJECT_KEY, value: key })
      );
    });
  }
};

const visitDataValue = (boobenValue, model, file, path) => {
  const calcArgsModel = (queryArgs, schema) => {
    const args = [];
    Object.keys(queryArgs).forEach(type => {
      Object.keys(queryArgs[type]).forEach(name => {
        walkBoobenValue(queryArgs[type][name], model, file, path);

        args.push({
          name,
          type: schema.types.Query.fields[type].args[name].type,
          value: generateBoobenValueAST(queryArgs[type][name]),
        });
      });
    });
    return args;
  };
  const findListGraphQL = component => {
    const values = [];

    const designerComponent = component.props.component.sourceData.component;
    const findDeep = component => {
      Object.keys(component.props).forEach(prop => {
        if (component.props[prop].source === 'data') {
          values.push(component.props[prop].sourceData);
        }
      });
      component.children.forEach(findDeep);
    };
    findDeep(designerComponent);
    return values;
  };

  if (boobenValue.sourceData.queryPath === null) return;

  file.usingGraphQL = true;

  const rootField = boobenValue.sourceData.queryPath[0].field;
  const queryField = model.schema.types.Query.fields[rootField];
  if (queryField) {
    let nestedValuesArray = [];
    let nestedArsArray = [];
    //TODO: fix Path Class
    const componentId = path._steps.filter(item => item.type === 1)[0].value;

    if (file.components[componentId].name === 'List') {
      const nested = findListGraphQL(file.components[componentId]);
      nested.forEach(item => {
        nestedValuesArray.push(
          item.queryPath.reduceRight((prev, current) => {
            return {
              [current.field]: prev,
            };
          }, {})
        );
        nestedArsArray.push(calcArgsModel(item.queryArgs, model.schema));
      });
    }
    let nestedValues = {};
    let nestedArgs = [];

    nestedValuesArray.forEach(
      item => (nestedValues = { ...nestedValues, ...item })
    );

    nestedArsArray.forEach(item => (nestedArgs = [...nestedArgs, ...item]));

    const previousValues =
      file.queries.get(queryField.name) &&
      file.queries.get(queryField.name).values;

    const previousArgs =
      (file.queries.get(queryField.name) &&
        file.queries.get(queryField.name).args) ||
      [];

    const newValues = boobenValue.sourceData.queryPath
      .slice(1)
      .reduceRight((prev, current) => {
        return {
          [current.field]: prev,
        };
      }, {});

    file.queries.set(queryField.name, {
      values: {
        ...previousValues,
        ...newValues,
        ...nestedValues,
      },
      args: [...previousArgs],
    });

    const args = calcArgsModel(boobenValue.sourceData.queryArgs, model.schema);

    if (boobenValue.sourceData.queryArgs[queryField.name]) {
      file.queries.set(queryField.name, {
        values: {
          ...file.queries.get(queryField.name).values,
        },
        args: [...previousArgs, ...args, ...nestedArgs],
      });
    }
  }
};

const addActionsForHandler = (file, path, actions) => {
  const serializedPath = path.serialize();

  if (file.handlers.has(serializedPath)) {
    file.handlers.get(serializedPath).actions.push(...actions);
  } else {
    file.handlers.set(serializedPath, { path, actions });
  }
};

const visitStateValue = (boobenValue, model, file) => {
  const componentId = boobenValue.sourceData.componentId;
  const component = file.components[componentId];
  const stateSlot = boobenValue.sourceData.stateSlot;
  const {
    namespace: componentNamespace,
    name: componentName,
  } = parseComponentName(component.name);

  const componentMeta =
    model.meta[componentNamespace].components[componentName];

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

      const value = propMeta.sourceConfigs.actions.updateState[stateSlot];

      addActionsForHandler(file, handlerPath, [
        {
          type: 'setState',
          params: { componentId, stateSlot, value },
        },
      ]);
    }
  });
};

const visitAction = (action, model, file, path) => {
  if (action.type === 'method') {
    file.refs.add(action.params.componentId);

    action.params.args.forEach((argValue, index) => {
      walkBoobenValue(
        argValue,
        model,
        file,
        path.extend([
          { type: Path.StepTypes.SWITCH, value: 'args' },
          { type: Path.StepTypes.METHOD_ARG, value: index },
        ])
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

    walkBoobenValue(
      action.params.value,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'value' })
    );
  } else if (action.type === 'navigate') {
    _.forOwn(action.params.routeParams, (paramValue, paramName) => {
      walkBoobenValue(
        paramValue,
        model,
        file,
        path.extend([
          { type: Path.StepTypes.SWITCH, value: 'routeParams' },
          { type: Path.StepTypes.ROUTE_PARAM_NAME, value: paramName },
        ])
      );
    });
  } else if (action.type === 'mutation') {
    file.usingGraphQL = true;
    const mutationName = action.params.mutation;

    if (model.project.auth.loginMutation === mutationName) {
      file.auth = model.project.auth;
    }

    const mutationReturnType =
      model.schema.types.Mutation.fields[mutationName].type;
    const returnFields = Object.keys(
      model.schema.types[mutationReturnType].fields
    );
    const values = returnFields[0];
    //TODO: this can be done better
    file.mutations.set(mutationName, {
      args: Object.keys(action.params.args).map(item => {
        return {
          name: item,
          type: !model.schema.types.Mutation.fields[mutationName].args[item]
            .nonNull
            ? model.schema.types.Mutation.fields[mutationName].args[item].type
            : `${
                model.schema.types.Mutation.fields[mutationName].args[item].type
              }!`,
        };
      }),
      values,
    });

    _.forOwn(action.params.args, (argValue, argName) => {
      walkBoobenValue(
        argValue,
        model,
        file,
        path.extend([
          { type: Path.StepTypes.SWITCH, value: 'args' },
          { type: Path.StepTypes.MUTATION_ARG, value: argName },
        ])
      );
    });
  } else if (action.type === 'ajax') {
    walkBoobenValue(
      action.param.url,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'url' })
    );

    walkBoobenValue(
      action.param.body,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'body' })
    );
  } else if (action.type === 'url') {
    file.importHelpers.add('openUrl');

    if (!model.helpers.openUrl) {
      model.helpers.openUrl = true;
    }
  } else if (action.type === 'logout') {
    file.importHelpers.add('logout');

    if (!model.helpers.openUrl) {
      model.helpers.logout = true;
    }
  }

  if (action.params && action.params.successActions) {
    visitActionsList(
      action.params.successActions,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'successActions' })
    );
  }

  if (action.params && action.params.errorActions) {
    visitActionsList(
      action.params.errorActions,
      model,
      file,
      path.extend({ type: Path.StepTypes.SWITCH, value: 'errorActions' })
    );
  }
};

const visitActionsList = (actions, model, file, path) => {
  actions.forEach((action, index) => {
    visitAction(
      action,
      model,
      file,
      path.extend({ type: Path.StepTypes.ACTION_INDEX, value: index })
    );
  });
};

const visitActionsValue = (boobenValue, model, file, path) => {
  addActionsForHandler(file, path, boobenValue.sourceData.actions);

  visitActionsList(
    boobenValue.sourceData.actions,
    model,
    file,
    path.extend({ type: Path.StepTypes.SWITCH, value: 'actions' })
  );
};

const visitFunctionArgsList = (args, model, file, path) => {
  args.forEach((argValue, index) => {
    walkBoobenValue(
      argValue,
      model,
      file,
      path.extend({ type: Path.StepTypes.FUNCTION_ARG, value: index })
    );
  });
};

const visitFunctionValue = (boobenValue, model, file, path) => {
  const funcName = boobenValue.sourceData.function;

  if (boobenValue.sourceData.functionSource === 'project') {
    file.importProjectFunctions.add(funcName);
  } else {
    file.importBuiltinFunctions.add(funcName);
  }

  visitFunctionArgsList(
    boobenValue.sourceData.args,
    model,
    file,
    path.extend({ type: Path.StepTypes.SWITCH, value: 'args' })
  );
};

const visitRouteParamsValue = file => {
  file.needRouteParams = true;
};

const visitDesignerValue = (boobenValue, path, emitFile) => {
  const fileName = formatDesignedComponentName(path);
  const components = normalizeComponents(boobenValue.sourceData.component);
  emitFile(fileName, FileTypes.DESIGNED_COMPONENT, components, 0);
};

const walkBoobenValue = (boobenValue, model, file, path, emitFile) => {
  switch (boobenValue.source) {
    case 'static':
      visitStaticValue(boobenValue, model, file, path);
      break;
    case 'const':
      break;
    case 'data':
      visitDataValue(boobenValue, model, file, path);
      break;
    case 'actions':
      visitActionsValue(boobenValue, model, file, path);
      break;
    case 'routeParams':
      visitRouteParamsValue(file);
      break;
    case 'state':
      visitStateValue(boobenValue, model, file);
      break;
    case 'function':
      visitFunctionValue(boobenValue, model, file, path);
      break;
    case 'designer':
      visitDesignerValue(boobenValue, path, emitFile);
      break;
    case 'ownerProp':
      break;
    case 'actionArg':
      break;
    default:
      throw new Error(`Got BoobenValue with unknown source: ${boobenValue.source}`);
  }
};

module.exports = walkBoobenValue;
