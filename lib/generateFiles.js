'use strict';

const generateComponentFile = require('./generateComponentFile');
const generateFunctionsFile = require('./generateFunctionsFile');
const generateEntryPointFile = require('./generateEntryPointFile');
const generatePackageJSONFile = require('./generatePackageJSONFile');

const {
  entryPointFile,
  functionsFile,
  componentsDirectory,
  defaultContainerId,
} = require('./constants');

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
 * @return {Promise<Object<string, FSNode>>}
 */
const generateFiles = async (
  model,
  { version = '1.0.0', urlPrefix = '/', containerId = defaultContainerId } = {}
) => {
  const ret = {
    [componentsDirectory]: {
      type: 'dir',
      content: {},
    },
    [entryPointFile]: {
      type: 'file',
      content: generateEntryPointFile(model, { urlPrefix, containerId }),
    },
    'package.json': {
      type: 'file',
      content: generatePackageJSONFile(model, { version }),
    },
  };

  if (Object.keys(model.functions).length > 0) {
    ret[functionsFile] = {
      type: 'file',
      content: generateFunctionsFile(model.functions),
    };
  }

  model.files.forEach(file => {
    ret[componentsDirectory].content[file.name] = {
      type: 'dir',
      content: {
        [`${file.name}.js`]: {
          type: 'file',
          content: generateComponentFile(file, model),
        },
      },
    };
  });

  return ret;
};

module.exports = generateFiles;
