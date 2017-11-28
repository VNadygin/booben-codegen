/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const npa = require('npm-package-arg');
const v = require('./versions');

/**
 *
 * @param {JssyProjectModel} model
 * @param {string} [version='1.0.0']
 * @return {string}
 */
const generatePackageJSONFile = (model, { version = '1.0.0' } = {}) => {
  const packageJSON = {
    name: model.project.name,
    description: 'App made with jssy',
    version,
    author: model.project.author,
    license: 'UNLICENSED',
    private: true,
    dependencies: {
      react: v('react'),
      'react-dom': v('react-dom'),
      'react-router': v('react-router'),
      'react-router-dom': v('react-router-dom'),
    },
  };

  model.project.componentLibs.forEach(lib => {
    const { name, rawSpec } = npa(lib);
    packageJSON.dependencies[name] = rawSpec;
  });

  if (model.usingGraphQL) {
    packageJSON.dependencies['apollo-client'] = v('apollo-client');
    packageJSON.dependencies['react-apollo'] = v('react-apollo');
  }

  return JSON.stringify(packageJSON);
};

module.exports = generatePackageJSONFile;
