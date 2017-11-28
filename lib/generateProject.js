/**
 * @author Dmitriy Bizyaev
 */

const os = require('os');
const path = require('path');
const fs = require('mz/fs');
const thenify = require('thenify');
const rimraf = thenify(require('rimraf'));
const installDependencies = require('./installDependencies');
const getMetadata = require('./getMetadata');
const buildModel = require('./buildModel');
const generateFiles = require('./generateFiles');
const writeFiles = require('./writeFiles');
const { defaultContainerId } = require('./constants');

/**
 *
 * @return {void}
 */
const noop = () => {};

/**
 * @typedef {Object} Logger
 * @property {function(message: *)} log
 * @property {function(message: *)} info
 * @property {function(message: *)} warn
 * @property {function(message: *)} error
 */

/**
 *
 * @type {Logger}
 */
const dummyLogger = {
  log: noop,
  info: noop,
  warn: noop,
  error: noop,
};

/**
 *
 * @param {Object} jssyProject
 * @param {string} outputDir
 * @param {string} [version]
 * @param {string} [urlPrefix]
 * @param {string} [containerId]
 * @param {?Object} [outputFs]
 * @param {boolean} [clean]
 * @param {Logger} [logger]
 * @return {Promise<void>}
 */
const generateProject = async (
  jssyProject,
  outputDir,
  {
    version = '1.0.0',
    urlPrefix = '/',
    containerId = defaultContainerId,
    fs: outputFs = null,
    clean = true,
    logger = dummyLogger,
  } = {}
) => {
  logger.log('Creating temporary directory');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jssy-'));

  logger.log('Installing component libraries');
  const { componentLibs } = jssyProject;
  await installDependencies(componentLibs, tempDir);

  logger.log('Gathering metadata');
  const meta = await getMetadata(componentLibs, tempDir);

  logger.log('Building model');
  const model = buildModel(jssyProject, meta);

  logger.log('Generating files');
  const files = await generateFiles(model, {
    version,
    urlPrefix,
    containerId,
  });

  logger.log('Writing files');
  await writeFiles(files, outputDir, outputFs);

  if (clean) {
    logger.log('Removing temporary directory');
    await rimraf(tempDir);
  }

  logger.log('Done');
};

module.exports = generateProject;
