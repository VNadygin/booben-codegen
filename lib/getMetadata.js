'use strict';

const { join } = require('path');
const npa = require('npm-package-arg');
const { gatherMetadata } = require('@jssy/metadata');

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
const getMetadata = async (componentLibs, outputDir) => {
  const metadata = {};

  for (let i = 0; i < componentLibs.length; i++) {
    const { name } = npa(componentLibs[i]);
    const path = join(outputDir, 'node_modules', name);
    const meta = await gatherMetadata(path);

    meta.moduleName = name;
    metadata[meta.namespace] = meta;
  }

  return metadata;
};

module.exports = getMetadata;
