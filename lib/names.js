/**
 * @author Dmitriy Bizyaev
 */

const { INVALID_ID } = require('./constants');

exports.formatRouteComponentName = route => `Route${route.id}`;

exports.formatRouteIndexComponentName = route => `Route${route.id}Index`;

exports.formatComponentRefKey = component => `_component${component.id}Ref`;

exports.formatComponentSaveRefMethodName = component =>
  `saveComponent${component.id}Ref`;

exports.formatStateKeyForProp = (component, propName, isSystemProp) =>
  isSystemProp
    ? `component${component.id}__${propName}`
    : `component${component.id}_${propName}`;

exports.formatComponentStateSlotKey = (component, stateSlot) =>
  `component${component.id}State_${stateSlot}`;

exports.formatHandlerName = path => {
  const componentId = path.getComponentId();
  const propName = path.getPropName();

  if (componentId === INVALID_ID || !propName) {
    return '';
  }

  return `handleComponent${componentId}${propName}`;
};
