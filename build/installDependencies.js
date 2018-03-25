/**
 * @author Dmitriy Bizyaev
 */

'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _require = require('mz/child_process'),
    exec = _require.exec;

/**
 *
 * @param {Array<string>} dependencies
 * @param {string} path
 * @return {Promise<void>}
 */


var installDependencies = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(dependencies, path) {
    var libs;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            libs = [].concat(_toConsumableArray(dependencies)).join(' ');
            _context.next = 3;
            return exec('npm init -y', { cwd: path });

          case 3:
            _context.next = 5;
            return exec('npm i --save ' + libs, { cwd: path });

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function installDependencies(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = installDependencies;
//# sourceMappingURL=installDependencies.js.map