'use strict';

const path = require('path');
const thenifyAll = require('thenify-all');

/**
 *
 * @type {Array<string>}
 */
const fsFunctions = ['stat', 'mkdir', 'writeFile'];

/**
 *
 * @param {Object} fs
 * @param {string} path
 * @return {Promise<boolean>}
 */
const isDirectory = async (fs, path) => {
  const stats = await fs.stat(path);
  return stats.isDirectory();
};

/**
 *
 * @param {Object} fs
 * @param {string} basePath
 * @param {Object<string, FSNode>} files
 * @return {Promise.<void>}
 */
const writeRecursive = async (fs, basePath, files) => {
  const fileNames = Object.keys(files);

  for (let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i];
    const file = files[fileName];
    const filePath = path.join(basePath, fileName);

    if (file.type === 'dir') {
      await fs.mkdir(filePath);
      await writeRecursive(fs, filePath, file.content);
    } else if (file.type === 'file') {
      if (typeof file.content === 'string' || file.content instanceof Buffer) {
        await fs.writeFile(filePath, file.content);
      } else {
        throw new Error(`writeFiles: dont know how to write ${filePath}`);
      }
    } else {
      throw new Error(`writeFiles: unknown file type: ${file.type}`);
    }
  }
};

/**
 *
 * @param {Object<string, FSNode>} files
 * @param {string} outputDir
 * @param {Object} [fs=null]
 * @return {Promise<void>}
 */
const writeFiles = async (files, outputDir, fs = null) => {
  fs = thenifyAll.withCallback(fs || require('fs'), {}, fsFunctions);

  if (!await isDirectory(fs, outputDir)) {
    throw new Error(`writeFiles: ${outputDir} is not a directory`);
  }

  await writeRecursive(fs, outputDir, files);
};

module.exports = writeFiles;
