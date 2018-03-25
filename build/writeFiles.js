/**
 * @author Dmitriy Bizyaev
 */

'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var path = require('path');
var thenifyAll = require('thenify-all');

/**
 *
 * @type {Array<string>}
 */
var fsFunctions = ['stat', 'mkdir', 'writeFile'];

/**
 *
 * @param {Object} fs
 * @param {string} path
 * @return {Promise<boolean>}
 */
var isDirectory = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(fs, path) {
    var stats;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return fs.stat(path);

          case 2:
            stats = _context.sent;
            return _context.abrupt('return', stats.isDirectory());

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function isDirectory(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 *
 * @param {Object} fs
 * @param {string} basePath
 * @param {Object<string, FSNode>} files
 * @return {Promise.<void>}
 */
var writeRecursive = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(fs, basePath, files) {
    var fileNames, i, fileName, file, filePath;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            fileNames = Object.keys(files);
            i = 0;

          case 2:
            if (!(i < fileNames.length)) {
              _context2.next = 26;
              break;
            }

            fileName = fileNames[i];
            file = files[fileName];
            filePath = path.join(basePath, fileName);

            if (!(file.type === 'dir')) {
              _context2.next = 13;
              break;
            }

            _context2.next = 9;
            return fs.mkdir(filePath);

          case 9:
            _context2.next = 11;
            return writeRecursive(fs, filePath, file.content);

          case 11:
            _context2.next = 23;
            break;

          case 13:
            if (!(file.type === 'file')) {
              _context2.next = 22;
              break;
            }

            if (!(typeof file.content === 'string' || file.content instanceof Buffer)) {
              _context2.next = 19;
              break;
            }

            _context2.next = 17;
            return fs.writeFile(filePath, file.content);

          case 17:
            _context2.next = 20;
            break;

          case 19:
            throw new Error('writeFiles: dont know how to write ' + filePath);

          case 20:
            _context2.next = 23;
            break;

          case 22:
            throw new Error('writeFiles: unknown file type: ' + file.type);

          case 23:
            i++;
            _context2.next = 2;
            break;

          case 26:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function writeRecursive(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 *
 * @param {Object<string, FSNode>} files
 * @param {string} outputDir
 * @param {Object} [fs=null]
 * @return {Promise<void>}
 */
var writeFiles = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(files, outputDir) {
    var fs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            fs = thenifyAll.withCallback(fs || require('fs'), {}, fsFunctions);

            _context3.next = 3;
            return isDirectory(fs, outputDir);

          case 3:
            if (_context3.sent) {
              _context3.next = 5;
              break;
            }

            throw new Error('writeFiles: ' + outputDir + ' is not a directory');

          case 5:
            _context3.next = 7;
            return writeRecursive(fs, outputDir, files);

          case 7:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function writeFiles(_x7, _x8) {
    return _ref3.apply(this, arguments);
  };
}();

module.exports = writeFiles;
//# sourceMappingURL=writeFiles.js.map