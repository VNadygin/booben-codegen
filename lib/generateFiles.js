'use strict';

const generateComponentFile = require('./generateComponentFile');
const generateFunctionsFile = require('./generateFunctionsFile');
const generateEntryPointFile = require('./generateEntryPointFile');
const generateEntryHTMLFile = require('./generateEntryHTMLFile');
const generatePackageJSONFile = require('./generatePackageJSONFile');
const generateHelpersFile = require('./generateHelpersFile');
const generateCSSFile = require('./generateCSSFile');

const {
  entryPointFile,
  stylesFile,
  functionsFile,
  helpersFile,
  componentsDirectory,
  defaultContainerId,
  entryHTMLFile,
} = require('./constants');

/**
 * @typedef {Object} FSNode
 * @property {string} type
 * @property {string|Buffer|Object<string, FSNode>} content
 */

/**
 *
 * @param {BoobenProjectModel} model
 * @param {string} [version='1.0.0']
 * @param {string} [urlPrefix='/']
 * @param {string} [containerId]
 * @return {Object<string, FSNode>}
 */
const generateFiles = (
  model,
  { version = '1.0.0', urlPrefix = '/', containerId = defaultContainerId } = {}
) => {
  const ret = {
    src: {
      type: 'dir',
      content: {
        [componentsDirectory]: {
          type: 'dir',
          content: {},
        },
        [entryPointFile]: {
          type: 'file',
          content: generateEntryPointFile(model, { urlPrefix, containerId }),
        },
        [stylesFile]: {
          type: 'file',
          content: generateCSSFile(model, { urlPrefix, containerId }),
        },
      },
    },
    public: {
      type: 'dir',
      content: {
        [entryHTMLFile]: {
          type: 'file',
          content: generateEntryHTMLFile(),
        },
      },
    },
    'package.json': {
      type: 'file',
      content: generatePackageJSONFile(model, { version }),
    },
  };

  if (Object.keys(model.functions).length > 0) {
    ret.src.content[functionsFile] = {
      type: 'file',
      content: generateFunctionsFile(model.functions),
    };
  }

  if (model.helpers.openUrl || model.helpers.logout) {
    ret.src.content[helpersFile] = {
      type: 'file',
      content: generateHelpersFile(model.helpers),
    };
  }

  const createComponentFile = (file, directoryNode, nestingLevel = 0) => {
    directoryNode.content[file.name] = {
      type: 'dir',
      content: {
        [`${file.name}.js`]: {
          type: 'file',
          content: generateComponentFile(file, model, nestingLevel),
        },
      },
    };

    file.nestedFiles.forEach(nestedFile => {
      createComponentFile(
        nestedFile,
        directoryNode.content[file.name],
        nestingLevel + 1
      );
    });
  };

  model.files.forEach(file => {
    createComponentFile(file, ret.src.content[componentsDirectory]);
  });

  return ret;
};

module.exports = generateFiles;
