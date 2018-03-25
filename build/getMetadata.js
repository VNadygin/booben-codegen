'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _require = require('path'),
    join = _require.join;

var npa = require('npm-package-arg');

var _require2 = require('@jssy/metadata'),
    gatherMetadata = _require2.gatherMetadata;

/**
 * @typedef {LibMetadata} CodegenLibMetadata
 * @property {string} moduleName
 */

/**
 *
 * @param {Array<string>} componentLibs
 * @param {string} outputDir
 * @return {Promise<Object<string, CodegenLibMetadata>>}
 */


var getMetadata = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(componentLibs, outputDir) {
    var metadata, i, _npa, name, path, meta;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            metadata = {};
            i = 0;

          case 2:
            if (!(i < componentLibs.length)) {
              _context.next = 13;
              break;
            }

            _npa = npa(componentLibs[i]), name = _npa.name;
            path = join(outputDir, 'node_modules', name);
            _context.next = 7;
            return gatherMetadata(path);

          case 7:
            meta = _context.sent;


            meta.moduleName = name;
            metadata[meta.namespace] = meta;

          case 10:
            i++;
            _context.next = 2;
            break;

          case 13:
            return _context.abrupt('return', metadata);

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function getMetadata(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getMetadata;
//# sourceMappingURL=getMetadata.js.map