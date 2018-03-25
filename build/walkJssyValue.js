'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _ = require('lodash');
var Path = require('./Path');

var _require = require('./names'),
    formatDesignedComponentName = _require.formatDesignedComponentName;

var _require2 = require('./misc'),
    normalizeComponents = _require2.normalizeComponents,
    parseComponentName = _require2.parseComponentName;

var _require3 = require('./constants'),
    FileTypes = _require3.FileTypes;

var generateJssyValueAST = require('./generateJssyValueAST');

var visitStaticValue = function visitStaticValue(jssyValue, model, file, path) {
  var value = jssyValue.sourceData.value;

  if (_.isArray(value)) {
    value.forEach(function (itemValue, index) {
      walkJssyValue(itemValue, model, file, path.extend({ type: Path.StepTypes.ARRAY_INDEX, value: index }));
    });
  } else if (_.isObject(value)) {
    _.forOwn(value, function (itemValue, key) {
      walkJssyValue(itemValue, model, file, path.extend({ type: Path.StepTypes.OBJECT_KEY, value: key }));
    });
  }
};

var visitDataValue = function visitDataValue(jssyValue, model, file, path) {
  var calcArgsModel = function calcArgsModel(queryArgs, schema) {
    var args = [];
    Object.keys(queryArgs).forEach(function (type) {
      Object.keys(queryArgs[type]).forEach(function (name) {
        walkJssyValue(queryArgs[type][name], model, file, path);

        args.push({
          name: name,
          type: schema.types.Query.fields[type].args[name].type,
          value: generateJssyValueAST(queryArgs[type][name])
        });
      });
    });
    return args;
  };
  var findListGraphQL = function findListGraphQL(component) {
    var values = [];

    var designerComponent = component.props.component.sourceData.component;
    var findDeep = function findDeep(component) {
      Object.keys(component.props).forEach(function (prop) {
        if (component.props[prop].source === 'data') {
          values.push(component.props[prop].sourceData);
        }
      });
      component.children.forEach(findDeep);
    };
    findDeep(designerComponent);
    return values;
  };

  file.usingGraphQL = true;
  var rootField = jssyValue.sourceData.queryPath[0].field;
  var queryField = model.schema.types.Query.fields[rootField];
  if (queryField) {
    var nestedValuesArray = [];
    var nestedArsArray = [];
    //TODO: fix Path Class
    var componentId = path._steps.filter(function (item) {
      return item.type === 1;
    })[0].value;

    if (file.components[componentId].name === 'List') {
      var nested = findListGraphQL(file.components[componentId]);
      nested.forEach(function (item) {
        nestedValuesArray.push(item.queryPath.reduceRight(function (prev, current) {
          return _defineProperty({}, current.field, prev);
        }, {}));
        nestedArsArray.push(calcArgsModel(item.queryArgs, model.schema));
      });
    }
    var nestedValues = {};
    var nestedArgs = [];

    nestedValuesArray.forEach(function (item) {
      return nestedValues = _extends({}, nestedValues, item);
    });

    nestedArsArray.forEach(function (item) {
      return nestedArgs = [].concat(_toConsumableArray(nestedArgs), _toConsumableArray(item));
    });

    var previousValues = file.queries.get(queryField.name) && file.queries.get(queryField.name).values;

    var previousArgs = file.queries.get(queryField.name) && file.queries.get(queryField.name).args || [];

    var newValues = jssyValue.sourceData.queryPath.slice(1).reduceRight(function (prev, current) {
      return _defineProperty({}, current.field, prev);
    }, {});

    file.queries.set(queryField.name, {
      values: _extends({}, previousValues, newValues, nestedValues),
      args: [].concat(_toConsumableArray(previousArgs))
    });

    var args = calcArgsModel(jssyValue.sourceData.queryArgs, model.schema);

    if (jssyValue.sourceData.queryArgs[queryField.name]) {
      file.queries.set(queryField.name, {
        values: _extends({}, file.queries.get(queryField.name).values),
        args: [].concat(_toConsumableArray(previousArgs), _toConsumableArray(args), _toConsumableArray(nestedArgs))
      });
    }
  }
};

var addActionsForHandler = function addActionsForHandler(file, path, actions) {
  var serializedPath = path.serialize();

  if (file.handlers.has(serializedPath)) {
    var _file$handlers$get$ac;

    (_file$handlers$get$ac = file.handlers.get(serializedPath).actions).push.apply(_file$handlers$get$ac, _toConsumableArray(actions));
  } else {
    file.handlers.set(serializedPath, { path: path, actions: actions });
  }
};

var visitStateValue = function visitStateValue(jssyValue, model, file) {
  var componentId = jssyValue.sourceData.componentId;
  var component = file.components[componentId];
  var stateSlot = jssyValue.sourceData.stateSlot;

  var _parseComponentName = parseComponentName(component.name),
      componentNamespace = _parseComponentName.namespace,
      componentName = _parseComponentName.name;

  var componentMeta = model.meta[componentNamespace].components[componentName];

  if (!file.activeStateSlots.has(componentId)) {
    file.activeStateSlots.set(componentId, new Set());
  }

  file.activeStateSlots.get(componentId).add(stateSlot);

  Object.keys(componentMeta.props).forEach(function (propName) {
    var propMeta = componentMeta.props[propName];

    if (propMeta.sourceConfigs && propMeta.sourceConfigs.actions && propMeta.sourceConfigs.actions.updateState && propMeta.sourceConfigs.actions.updateState[stateSlot]) {
      var handlerPath = new Path([{ type: Path.StepTypes.COMPONENT_ID, value: componentId }, { type: Path.StepTypes.SWITCH, value: 'props' }, { type: Path.StepTypes.COMPONENT_PROP_NAME, value: propName }]);

      var value = propMeta.sourceConfigs.actions.updateState[stateSlot];

      addActionsForHandler(file, handlerPath, [{
        type: 'setState',
        params: { componentId: componentId, stateSlot: stateSlot, value: value }
      }]);
    }
  });
};

var visitAction = function visitAction(action, model, file, path) {
  if (action.type === 'method') {
    file.refs.add(action.params.componentId);

    action.params.args.forEach(function (argValue, index) {
      walkJssyValue(argValue, model, file, path.extend([{ type: Path.StepTypes.SWITCH, value: 'args' }, { type: Path.StepTypes.METHOD_ARG, value: index }]));
    });
  } else if (action.type === 'prop') {
    var fileKey = void 0;
    var paramsKey = void 0;

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

    walkJssyValue(action.params.value, model, file, path.extend({ type: Path.StepTypes.SWITCH, value: 'value' }));
  } else if (action.type === 'navigate') {
    _.forOwn(action.params.routeParams, function (paramValue, paramName) {
      walkJssyValue(paramValue, model, file, path.extend([{ type: Path.StepTypes.SWITCH, value: 'routeParams' }, { type: Path.StepTypes.ROUTE_PARAM_NAME, value: paramName }]));
    });
  } else if (action.type === 'mutation') {
    file.usingGraphQL = true;
    var mutationName = action.params.mutation;

    if (model.project.auth.loginMutation === mutationName) {
      file.auth = model.project.auth;
    }

    var mutationReturnType = model.schema.types.Mutation.fields[mutationName].type;
    var returnFields = Object.keys(model.schema.types[mutationReturnType].fields);
    var values = returnFields[0];
    //TODO: this can be done better
    file.mutations.set(mutationName, {
      args: Object.keys(action.params.args).map(function (item) {
        return {
          name: item,
          type: !model.schema.types.Mutation.fields[mutationName].args[item].nonNull ? model.schema.types.Mutation.fields[mutationName].args[item].type : model.schema.types.Mutation.fields[mutationName].args[item].type + '!'
        };
      }),
      values: values
    });

    _.forOwn(action.params.args, function (argValue, argName) {
      walkJssyValue(argValue, model, file, path.extend([{ type: Path.StepTypes.SWITCH, value: 'args' }, { type: Path.StepTypes.MUTATION_ARG, value: argName }]));
    });
  } else if (action.type === 'ajax') {
    walkJssyValue(action.param.url, model, file, path.extend({ type: Path.StepTypes.SWITCH, value: 'url' }));

    walkJssyValue(action.param.body, model, file, path.extend({ type: Path.StepTypes.SWITCH, value: 'body' }));
  } else if (action.type === 'url') {
    file.importHelpers.add('openUrl');

    if (!model.helpers.openUrl) {
      model.helpers.openUrl = true;
    }
  }

  if (action.params.successActions) {
    visitActionsList(action.params.successActions, model, file, path.extend({ type: Path.StepTypes.SWITCH, value: 'successActions' }));
  }

  if (action.params.errorActions) {
    visitActionsList(action.params.errorActions, model, file, path.extend({ type: Path.StepTypes.SWITCH, value: 'errorActions' }));
  }
};

var visitActionsList = function visitActionsList(actions, model, file, path) {
  actions.forEach(function (action, index) {
    visitAction(action, model, file, path.extend({ type: Path.StepTypes.ACTION_INDEX, value: index }));
  });
};

var visitActionsValue = function visitActionsValue(jssyValue, model, file, path) {
  addActionsForHandler(file, path, jssyValue.sourceData.actions);

  visitActionsList(jssyValue.sourceData.actions, model, file, path.extend({ type: Path.StepTypes.SWITCH, value: 'actions' }));
};

var visitFunctionArgsList = function visitFunctionArgsList(args, model, file, path) {
  args.forEach(function (argValue, index) {
    walkJssyValue(argValue, model, file, path.extend({ type: Path.StepTypes.FUNCTION_ARG, value: index }));
  });
};

var visitFunctionValue = function visitFunctionValue(jssyValue, model, file, path) {
  var funcName = jssyValue.sourceData.function;

  if (jssyValue.sourceData.functionSource === 'project') {
    file.importProjectFunctions.add(funcName);
  } else {
    file.importBuiltinFunctions.add(funcName);
  }

  visitFunctionArgsList(jssyValue.sourceData.args, model, file, path.extend({ type: Path.StepTypes.SWITCH, value: 'args' }));
};

var visitRouteParamsValue = function visitRouteParamsValue(file) {
  file.needRouteParams = true;
};

var visitDesignerValue = function visitDesignerValue(jssyValue, path, emitFile) {
  var fileName = formatDesignedComponentName(path);
  var components = normalizeComponents(jssyValue.sourceData.component);
  emitFile(fileName, FileTypes.DESIGNED_COMPONENT, components, 0);
};

var walkJssyValue = function walkJssyValue(jssyValue, model, file, path, emitFile) {
  switch (jssyValue.source) {
    case 'static':
      visitStaticValue(jssyValue, model, file, path);
      break;
    case 'const':
      break;
    case 'data':
      visitDataValue(jssyValue, model, file, path);
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
      visitDesignerValue(jssyValue, path, emitFile);
      break;
    case 'ownerProp':
      break;
    case 'actionArg':
      break;
    default:
      throw new Error('Got JssyValue with unknown source: ' + jssyValue.source);
  }
};

module.exports = walkJssyValue;
//# sourceMappingURL=walkJssyValue.js.map