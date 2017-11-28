/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const { exec } = require('mz/child_process');

/**
 *
 * @param {Array<string>} dependencies
 * @param {string} path
 * @return {Promise<void>}
 */
const installDependencies = async (dependencies, path) => {
  const libs = dependencies.join(' ');
  await exec('npm init -y', { cwd: path });
  await exec(`npm i --save ${libs}`, { cwd: path });
};

module.exports = installDependencies;
