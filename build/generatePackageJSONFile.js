/**
 * @author Dmitriy Bizyaev
 */

'use strict';

var npa = require('npm-package-arg');
var v = require('./versions');

/**
 *
 * @param {JssyProjectModel} model
 * @param {string} [version='1.0.0']
 * @return {string}
 */
var generatePackageJSONFile = function generatePackageJSONFile(model) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$version = _ref.version,
      version = _ref$version === undefined ? '1.0.0' : _ref$version;

  var packageJSON = {
    name: model.project.name,
    description: 'App made with jssy',
    version: version,
    author: model.project.author,
    license: 'UNLICENSED',
    private: true,
    dependencies: {
      react: v('react'),
      'react-dom': v('react-dom'),
      'react-router': v('react-router'),
      'react-router-dom': v('react-router-dom'),
      'react-scripts': v('react-scripts'),
      'styled-components': v('styled-components')
    },
    scripts: {
      start: 'react-scripts start',
      build: 'react-scripts build',
      test: 'react-scripts test --env=jsdom',
      eject: 'react-scripts eject'
    }
  };

  model.project.componentLibs.forEach(function (lib) {
    var _npa = npa(lib),
        name = _npa.name,
        rawSpec = _npa.rawSpec;

    packageJSON.dependencies[name] = rawSpec;
  });

  if (model.usingGraphQL) {
    packageJSON.dependencies['apollo-client'] = v('apollo-client');
    packageJSON.dependencies['react-apollo'] = v('react-apollo');
    packageJSON.dependencies['apollo-link-http'] = v('apollo-link-http');
    packageJSON.dependencies['apollo-cache-inmemory'] = v('apollo-cache-inmemory');
    packageJSON.dependencies['graphql-tag'] = v('graphql-tag');
    packageJSON.dependencies['apollo-link-context'] = v('apollo-link-context');
  }

  return JSON.stringify(packageJSON, null, 2);
};

module.exports = generatePackageJSONFile;
//# sourceMappingURL=generatePackageJSONFile.js.map