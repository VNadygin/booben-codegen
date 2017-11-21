/**
 * @author Dmitriy Bizyaev
 */

exports.formatRouteComponentName = route => `Route${route.id}`;

exports.formatRouteIndexComponentName = route => `Route${route.id}Index`;

exports.formatComponentRefKey = component => `_component${component.id}Ref`;

exports.formatStateKeyForProp = (component, propName, isSystemProp) =>
  isSystemProp
    ? `_component${component.id}__${propName}`
    : `_component${component.id}_${propName}`;
