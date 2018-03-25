/**
 * @author Dmitriy Bizyaev
 */

'use strict';

// TODO: Make pretty names

var _ = require('lodash');

var _require = require('./constants'),
    INVALID_ID = _require.INVALID_ID;

var pascalCase = function pascalCase(str) {
  return _.upperFirst(_.camelCase(str));
};

exports.formatRouteComponentName = function (route) {
  return 'Route' + route.id;
};

exports.formatRouteIndexComponentName = function (route) {
  return 'Route' + route.id + 'Index';
};

exports.formatComponentRefKey = function (component) {
  return '_component' + component.id + 'Ref';
};

exports.formatComponentSaveRefMethodName = function (component) {
  return 'saveComponent' + component.id + 'Ref';
};

exports.formatStateKeyForProp = function (component, propName, isSystemProp) {
  return isSystemProp ? 'component' + component.id + '__' + propName : 'component' + component.id + '_' + propName;
};

exports.formatComponentStateSlotKey = function (component, stateSlot) {
  return 'component' + component.id + 'State_' + stateSlot;
};

exports.formatHandlerName = function (path) {
  var componentId = path.getComponentId();
  var propName = path.getPropName();

  if (componentId === INVALID_ID || !propName) {
    return '';
  }

  return 'handleComponent' + componentId + propName;
};

/**
 *
 * @param {Path} path
 * @return {string}
 */
exports.formatDesignedComponentName = function (path) {
  var componentId = path.getComponentId();
  var propName = path.getPropName();

  return 'Component' + componentId + pascalCase(propName);
};

exports.formatQueryNamespace = function (name) {
  return name + 'Query';
};

exports.formatMutationNamespace = function (name) {
  return name + 'Mutation';
};

exports.formatStyleClassName = function (routeName, componentId) {
  return routeName + 'Component' + componentId;
};
//# sourceMappingURL=names.js.map