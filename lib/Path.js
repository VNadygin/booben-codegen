/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const { INVALID_ID } = require('./constants');

const SEPARATOR = '\n';

class Path {
  constructor(steps = []) {
    this._steps = steps;
  }

  extend(step) {
    if (Array.isArray(step)) {
      return new Path([...this._steps, ...step]);
    } else {
      return new Path([...this._steps, step]);
    }
  }

  serialize() {
    return this._steps.map(step => step.value).join(SEPARATOR);
  }

  _getFirstValue(type, defaultValue) {
    const ret = { position: -1, value: defaultValue };

    for (let i = 0; i < this._steps.length; i++) {
      if (this._steps[i].type === type) {
        ret.position = i;
        ret.value = this._steps[i].value;
        break;
      }
    }

    return ret;
  }

  getComponentId() {
    return this._getFirstValue(Path.StepTypes.COMPONENT_ID, INVALID_ID).value;
  }

  getPropName(isSystemProp = false) {
    const { position, value } = this._getFirstValue(
      Path.StepTypes.COMPONENT_PROP_NAME,
      ''
    );

    const switchValue = isSystemProp ? 'systemProps' : 'props';

    if (
      position > 0 &&
      this._steps[position - 1].type === Path.StepTypes.SWITCH &&
      this._steps[position - 1].value === switchValue
    ) {
      return value;
    } else {
      return '';
    }
  }
}

Path.StepTypes = {
  SWITCH: 0,
  COMPONENT_ID: 1,
  COMPONENT_PROP_NAME: 2,
  ARRAY_INDEX: 3,
  OBJECT_KEY: 4,
  ACTION_INDEX: 5,
  METHOD_ARG: 6,
  MUTATION_ARG: 7,
  FUNCTION_ARG: 8,
  ROUTE_PARAM_NAME: 9,
};

module.exports = Path;
