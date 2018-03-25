'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * @author Dmitriy Bizyaev
 */

var os = require('os');
var path = require('path');
var fs = require('mz/fs');
var archiver = require('archiver');
var thenify = require('thenify');
var rimraf = thenify(require('rimraf'));
var prettyMs = require('pretty-ms');

var _require = require('@jssy/graphql-schema'),
    parseGraphQLSchema = _require.parseGraphQLSchema;

var installDependencies = require('./installDependencies');
// const getMetadata = require('./getMetadata');
var getGraphQLSchema = require('./getGraphQLSchema');
var buildModel = require('./buildModel');
var generateFiles = require('./generateFiles');
var writeFiles = require('./writeFiles');

var _require2 = require('./constants'),
    defaultContainerId = _require2.defaultContainerId;

var prettifyFiles = require('./prettifyFiles');
var archiveProject = require('./archiveProject');

/**
 *
 * @return {void}
 */
var noop = function noop() {};

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
var dummyLogger = {
  log: noop,
  info: noop,
  warn: noop,
  error: noop
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
var generateProject = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(jssyProject, outputDir) {
    var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref2$version = _ref2.version,
        version = _ref2$version === undefined ? '1.0.0' : _ref2$version,
        _ref2$urlPrefix = _ref2.urlPrefix,
        urlPrefix = _ref2$urlPrefix === undefined ? '/' : _ref2$urlPrefix,
        _ref2$containerId = _ref2.containerId,
        containerId = _ref2$containerId === undefined ? defaultContainerId : _ref2$containerId,
        _ref2$fs = _ref2.fs,
        outputFs = _ref2$fs === undefined ? null : _ref2$fs,
        _ref2$clean = _ref2.clean,
        clean = _ref2$clean === undefined ? true : _ref2$clean,
        _ref2$logger = _ref2.logger,
        logger = _ref2$logger === undefined ? dummyLogger : _ref2$logger;

    var startTime, meta, schema, graphQLSchema, model, files, totalTime;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            startTime = Date.now();

            // logger.log('Creating temporary directory');
            // const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jssy-'));

            // logger.log('Installing component libraries');
            // const { componentLibs } = jssyProject;
            // await installDependencies(componentLibs, tempDir);

            _context.next = 3;
            return rimraf(outputDir);

          case 3:
            _context.next = 5;
            return fs.mkdir(outputDir);

          case 5:

            logger.log('Gathering metadata');
            // TODO: fetch meta from server
            // const meta = await getMetadata(componentLibs, tempDir);

            meta = require('../meta.json');
            schema = null;

            if (!jssyProject.graphQLEndpointURL) {
              _context.next = 15;
              break;
            }

            logger.log('Downloading GraphQL schema from ' + jssyProject.graphQLEndpointURL);

            _context.next = 12;
            return getGraphQLSchema(jssyProject.graphQLEndpointURL);

          case 12:
            graphQLSchema = _context.sent;


            logger.log('Parsing GraphQL schema');
            schema = parseGraphQLSchema(graphQLSchema);

          case 15:

            logger.log('Building model');
            model = buildModel(jssyProject, meta, schema);


            logger.log('Generating files');
            files = generateFiles(model, {
              version: version,
              urlPrefix: urlPrefix,
              containerId: containerId
            });


            logger.log('Writing files');
            _context.next = 22;
            return writeFiles(files, outputDir, outputFs);

          case 22:

            // if (clean) {
            //   logger.log('Removing temporary directory');
            //   await rimraf(tempDir);
            // }

            // logger.log('Prettify files');
            // await prettifyFiles();

            logger.log('Building archive folder');
            _context.next = 25;
            return archiveProject(outputDir);

          case 25:
            totalTime = Date.now() - startTime;

            logger.log('Done in ' + prettyMs(totalTime));

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function generateProject(_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = generateProject;
//# sourceMappingURL=generateProject.js.map