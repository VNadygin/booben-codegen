'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var generateComponentFile = require('./generateComponentFile');
var generateFunctionsFile = require('./generateFunctionsFile');
var generateEntryPointFile = require('./generateEntryPointFile');
var generateEntryHTMLFile = require('./generateEntryHTMLFile');
var generatePackageJSONFile = require('./generatePackageJSONFile');
var generateHelpersFile = require('./generateHelpersFile');
var generateCSSFile = require('./generateCSSFile');

var _require = require('./constants'),
    entryPointFile = _require.entryPointFile,
    stylesFile = _require.stylesFile,
    functionsFile = _require.functionsFile,
    helpersFile = _require.helpersFile,
    componentsDirectory = _require.componentsDirectory,
    defaultContainerId = _require.defaultContainerId,
    entryHTMLFile = _require.entryHTMLFile;

/**
 * @typedef {Object} FSNode
 * @property {string} type
 * @property {string|Buffer|Object<string, FSNode>} content
 */

/**
 *
 * @param {JssyProjectModel} model
 * @param {string} [version='1.0.0']
 * @param {string} [urlPrefix='/']
 * @param {string} [containerId]
 * @return {Object<string, FSNode>}
 */


var generateFiles = function generateFiles(model) {
  var _content;

  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$version = _ref.version,
      version = _ref$version === undefined ? '1.0.0' : _ref$version,
      _ref$urlPrefix = _ref.urlPrefix,
      urlPrefix = _ref$urlPrefix === undefined ? '/' : _ref$urlPrefix,
      _ref$containerId = _ref.containerId,
      containerId = _ref$containerId === undefined ? defaultContainerId : _ref$containerId;

  var ret = {
    src: {
      type: 'dir',
      content: (_content = {}, _defineProperty(_content, componentsDirectory, {
        type: 'dir',
        content: {}
      }), _defineProperty(_content, entryPointFile, {
        type: 'file',
        content: generateEntryPointFile(model, { urlPrefix: urlPrefix, containerId: containerId })
      }), _defineProperty(_content, stylesFile, {
        type: 'file',
        content: generateCSSFile(model, { urlPrefix: urlPrefix, containerId: containerId })
      }), _content)
    },
    public: {
      type: 'dir',
      content: _defineProperty({}, entryHTMLFile, {
        type: 'file',
        content: generateEntryHTMLFile()
      })
    },
    'package.json': {
      type: 'file',
      content: generatePackageJSONFile(model, { version: version })
    }
  };

  if (Object.keys(model.functions).length > 0) {
    ret.src.content[functionsFile] = {
      type: 'file',
      content: generateFunctionsFile(model.functions)
    };
  }

  if (model.helpers.openUrl) {
    ret.src.content[helpersFile] = {
      type: 'file',
      content: generateHelpersFile(model.helpers)
    };
  }

  var createComponentFile = function createComponentFile(file, directoryNode) {
    var nestingLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    directoryNode.content[file.name] = {
      type: 'dir',
      content: _defineProperty({}, file.name + '.js', {
        type: 'file',
        content: generateComponentFile(file, model, nestingLevel)
      })
    };

    file.nestedFiles.forEach(function (nestedFile) {
      createComponentFile(nestedFile, directoryNode.content[file.name], nestingLevel + 1);
    });
  };

  model.files.forEach(function (file) {
    createComponentFile(file, ret.src.content[componentsDirectory]);
  });

  return ret;
};

module.exports = generateFiles;
//# sourceMappingURL=generateFiles.js.map