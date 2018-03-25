/**
 * @author Dmitriy Bizyaev
 */

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('./constants'),
    INVALID_ID = _require.INVALID_ID;

var SEPARATOR = '\n';

var Path = function () {
  function Path() {
    var steps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, Path);

    this._steps = steps;
  }

  _createClass(Path, [{
    key: 'extend',
    value: function extend(step) {
      if (Array.isArray(step)) {
        return new Path([].concat(_toConsumableArray(this._steps), _toConsumableArray(step)));
      } else {
        return new Path([].concat(_toConsumableArray(this._steps), [step]));
      }
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      return this._steps.map(function (step) {
        return step.value;
      }).join(SEPARATOR);
    }
  }, {
    key: '_getFirstValue',
    value: function _getFirstValue(type, defaultValue) {
      var ret = { position: -1, value: defaultValue };

      for (var i = 0; i < this._steps.length; i++) {
        if (this._steps[i].type === type) {
          ret.position = i;
          ret.value = this._steps[i].value;
          break;
        }
      }

      return ret;
    }
  }, {
    key: 'getComponentId',
    value: function getComponentId() {
      return this._getFirstValue(Path.StepTypes.COMPONENT_ID, INVALID_ID).value;
    }
  }, {
    key: 'getPropName',
    value: function getPropName() {
      var isSystemProp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var _getFirstValue2 = this._getFirstValue(Path.StepTypes.COMPONENT_PROP_NAME, ''),
          position = _getFirstValue2.position,
          value = _getFirstValue2.value;

      var switchValue = isSystemProp ? 'systemProps' : 'props';

      if (position > 0 && this._steps[position - 1].type === Path.StepTypes.SWITCH && this._steps[position - 1].value === switchValue) {
        return value;
      } else {
        return '';
      }
    }
  }]);

  return Path;
}();

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
  ROUTE_PARAM_NAME: 9
};

module.exports = Path;
//# sourceMappingURL=Path.js.map