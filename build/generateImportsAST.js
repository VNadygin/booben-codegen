/**
 * @author Dmitriy Bizyaev
 */

'use strict';

var t = require('babel-types');

var _require = require('./constants'),
    functionsFile = _require.functionsFile,
    helpersFile = _require.helpersFile;

/**
 *
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @param {number} [nestingLevel=0]
 * @return {Array<ImportDeclaration>}
 */


var generateImportsAST = function generateImportsAST(file, model) {
  var nestingLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  var ret = [];

  // import React from 'react';
  var reactImportDeclaration = t.importDeclaration([t.importDefaultSpecifier(t.identifier('React'))], t.stringLiteral('react'));

  ret.push(reactImportDeclaration);

  if (file.usingGraphQL) {
    var graphqlImportDeclaration = t.importDeclaration([t.importSpecifier(t.identifier('graphql'), t.identifier('graphql')), t.importSpecifier(t.identifier('compose'), t.identifier('compose'))], t.stringLiteral('react-apollo'));

    var gqlTagDeclaration = t.importDeclaration([t.importDefaultSpecifier(t.identifier('gql'))], t.stringLiteral('graphql-tag'));

    ret.push(gqlTagDeclaration);
    ret.push(graphqlImportDeclaration);
  }

  if (file.usingReactRouter) {
    // import { Route, Switch } from 'react-router';
    var reactRouterImportDeclaration = t.importDeclaration([t.importSpecifier(t.identifier('Route'), t.identifier('Route')), t.importSpecifier(t.identifier('Switch'), t.identifier('Switch'))], t.stringLiteral('react-router'));

    ret.push(reactRouterImportDeclaration);
  }

  file.importComponents.forEach(function (componentNames, namespace) {
    var libMeta = model.meta[namespace];
    if (libMeta.namespace !== 'HTML') {
      // import { /* componentNames[0], ... */ } from '/* libMeta.moduleName */';
      var importDeclaration = t.importDeclaration(Array.from(componentNames).map(function (name) {
        return t.importSpecifier(t.identifier(name), t.identifier(name));
      }), t.stringLiteral(libMeta.moduleName));

      ret.push(importDeclaration);
    }
  });

  file.importFiles.forEach(function (fileName) {
    // import /* fileName */ from '..//* fileName *///* fileName */';
    var importDeclaration = t.importDeclaration([t.importDefaultSpecifier(t.identifier(fileName))], t.stringLiteral('../' + fileName + '/' + fileName));

    ret.push(importDeclaration);
  });

  file.importHelpers.forEach(function (name) {
    // import { /* name */ } from './/* nestedFile.name *///* nestedFile.name */';
    var importDeclaration = t.importDeclaration([t.importSpecifier(t.identifier(name), t.identifier(name))], t.stringLiteral('../../' + '../'.repeat(nestingLevel) + helpersFile));

    ret.push(importDeclaration);
  });

  file.nestedFiles.forEach(function (nestedFile) {
    // import /* nestedFile.name */ from './/* nestedFile.name *///* nestedFile.name */';
    var importDeclaration = t.importDeclaration([t.importDefaultSpecifier(t.identifier(nestedFile.name))], t.stringLiteral('./' + nestedFile.name + '/' + nestedFile.name));

    ret.push(importDeclaration);
  });

  if (file.importProjectFunctions.size > 0) {
    var functionsModule = functionsFile.slice(0, -3); // remove .js
    var functionNames = Array.from(file.importProjectFunctions);

    // import { /* functionNames[0], ... */ } from '../..//* functionsModule */';
    var functionsImportDeclaration = t.importDeclaration(functionNames.map(function (name) {
      return t.importSpecifier(t.identifier(name), t.identifier(name));
    }), t.stringLiteral('../../' + '../'.repeat(nestingLevel) + functionsModule) // remove .js
    );

    ret.push(functionsImportDeclaration);
  }

  return ret;
};

module.exports = generateImportsAST;
//# sourceMappingURL=generateImportsAST.js.map