/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const { exec } = require('mz/child_process');

/**
 *
 * @param {Array<string>} dependencies
 * @param {string} tempDir
 * @return {Promise<void>}
 */
const installDependencies = async (dependencies, tempDir) => {
  const libs = dependencies.join(' ');
  await exec('npm init -y', { cwd: tempDir });
  await exec(`npm i --save ${libs}`, { cwd: tempDir });
};

module.exports = installDependencies;
