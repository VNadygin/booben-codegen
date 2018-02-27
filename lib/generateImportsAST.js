/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const t = require('babel-types');
const { functionsFile, helpersFile } = require('./constants');

/**
 *
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @param {number} [nestingLevel=0]
 * @return {Array<ImportDeclaration>}
 */
const generateImportsAST = (file, model, nestingLevel = 0) => {
  const ret = [];

  // import React from 'react';
  const reactImportDeclaration = t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier('React'))],
    t.stringLiteral('react')
  );

  ret.push(reactImportDeclaration);

  if (file.usingGraphQL) {
    const graphqlImportDeclaration = t.importDeclaration(
      [
        t.importSpecifier(t.identifier('graphql'), t.identifier('graphql')),
        t.importSpecifier(t.identifier('compose'), t.identifier('compose')),
      ],
      t.stringLiteral('react-apollo')
    );

    const gqlTagDeclaration = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier('gql'))],
      t.stringLiteral('graphql-tag')
    );

    ret.push(gqlTagDeclaration);
    ret.push(graphqlImportDeclaration);
  }

  if (file.usingReactRouter) {
    // import { Route, Switch } from 'react-router';
    const reactRouterImportDeclaration = t.importDeclaration(
      [
        t.importSpecifier(t.identifier('Route'), t.identifier('Route')),
        t.importSpecifier(t.identifier('Switch'), t.identifier('Switch')),
      ],
      t.stringLiteral('react-router')
    );

    ret.push(reactRouterImportDeclaration);
  }

  file.importComponents.forEach((componentNames, namespace) => {
    const libMeta = model.meta[namespace];
    if (libMeta.namespace !== 'HTML') {
      // import { /* componentNames[0], ... */ } from '/* libMeta.moduleName */';
      const importDeclaration = t.importDeclaration(
        Array.from(componentNames).map(name =>
          t.importSpecifier(t.identifier(name), t.identifier(name))
        ),
        t.stringLiteral(libMeta.moduleName)
      );

      ret.push(importDeclaration);
    }
  });

  file.importFiles.forEach(fileName => {
    // import /* fileName */ from '..//* fileName *///* fileName */';
    const importDeclaration = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier(fileName))],
      t.stringLiteral(`../${fileName}/${fileName}`)
    );

    ret.push(importDeclaration);
  });

  file.importHelpers.forEach(name => {
    // import { /* name */ } from './/* nestedFile.name *///* nestedFile.name */';
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier(name), t.identifier(name))],
      t.stringLiteral(`../../${'../'.repeat(nestingLevel)}${helpersFile}`)
    );

    ret.push(importDeclaration);
  });

  file.nestedFiles.forEach(nestedFile => {
    // import /* nestedFile.name */ from './/* nestedFile.name *///* nestedFile.name */';
    const importDeclaration = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier(nestedFile.name))],
      t.stringLiteral(`./${nestedFile.name}/${nestedFile.name}`)
    );

    ret.push(importDeclaration);
  });

  if (file.importProjectFunctions.size > 0) {
    const functionsModule = functionsFile.slice(0, -3); // remove .js
    const functionNames = Array.from(file.importProjectFunctions);

    // import { /* functionNames[0], ... */ } from '../..//* functionsModule */';
    const functionsImportDeclaration = t.importDeclaration(
      functionNames.map(name =>
        t.importSpecifier(t.identifier(name), t.identifier(name))
      ),
      t.stringLiteral(`../../${'../'.repeat(nestingLevel)}${functionsModule}`) // remove .js
    );

    ret.push(functionsImportDeclaration);
  }

  return ret;
};

module.exports = generateImportsAST;
