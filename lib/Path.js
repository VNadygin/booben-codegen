/**
 * @author Dmitriy Bizyaev
 */

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
