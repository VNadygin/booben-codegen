/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const generate = require('babel-generator').default;
const t = require('babel-types');
const template = require('babel-template');
const { defaultContainerId, componentsDirectory } = require('./constants');

const fileTemplate = template(
  `
    import React from 'react';
    import ReactDOM from 'react-dom';
    import { Router, Switch, Route } from 'react-router';
    import { BrowserRouter } from 'react-router-dom';
    IMPORTS
    
    APOLLO_INIT
    
    window.addEventListener('DOMContentLoaded', () => {
      ReactDOM.render(
        JSX,
        window.document.getElementById(CONTAINER_ID),
      );
    });
  `,
  {
    sourceType: 'module',
    plugins: ['jsx'],
  }
);

const apolloInitTemplate = template(`
  const networkInterface = createNetworkInterface({
    uri: GRAPHQL_URL,
  });
  
  const apolloClient = new ApolloClient({ networkInterface });
`);

/**
 *
 * @param {JssyProjectModel} model
 * @param {string} [urlPrefix='/']
 * @param {string} [containerId='jssy-app-container']
 * @return {string}
 */
const generateEntryPointFile = (
  model,
  { urlPrefix = '/', containerId = defaultContainerId } = {}
) => {
  const imports = [];

  if (model.usingGraphQL) {
    const apolloClientImport = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier('ApolloClient'),
          t.identifier('ApolloClient')
        ),
        t.importSpecifier(
          t.identifier('createNetworkInterface'),
          t.identifier('createNetworkInterface')
        ),
      ],
      t.stringLiteral('apollo-client')
    );

    const apolloProviderImport = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier('ApolloProvider'),
          t.identifier('ApolloProvider')
        ),
      ],
      t.stringLiteral('react-apollo')
    );

    imports.push(apolloClientImport);
    imports.push(apolloProviderImport);
  }

  const routeElements = [];

  model.rootRoutes.forEach(routeId => {
    const route = model.routes[routeId];
    const routeComponentName = route.file.name;

    const routeElement = t.jSXElement(
      t.jSXOpeningElement(
        t.jSXIdentifier('Route'),
        [
          t.jSXAttribute(
            t.jSXIdentifier('path'),
            t.stringLiteral(route.fullPath)
          ),
          t.jSXAttribute(
            t.jSXIdentifier('component'),
            t.jSXExpressionContainer(t.identifier(routeComponentName))
          ),
        ],
        true
      ),
      null,
      []
    );

    const pathToComponentFile = `./${componentsDirectory}/${
      routeComponentName
    }/${routeComponentName}`;

    const importDeclaration = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier(routeComponentName))],
      t.stringLiteral(pathToComponentFile)
    );

    routeElements.push(routeElement);
    imports.push(importDeclaration);
  });

  const switchElement = t.jSXElement(
    t.jSXOpeningElement(t.jSXIdentifier('Switch'), []),
    t.jSXClosingElement(t.jSXIdentifier('Switch')),
    routeElements
  );

  let rootJSXElement = t.jSXElement(
    t.jSXOpeningElement(t.jSXIdentifier('BrowserRouter'), [
      t.jSXAttribute(t.jSXIdentifier('basename'), t.stringLiteral(urlPrefix)),
    ]),
    t.jSXClosingElement(t.jSXIdentifier('BrowserRouter')),
    [switchElement]
  );

  let apolloInit = [];

  if (model.usingGraphQL) {
    rootJSXElement = t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier('ApolloProvider'), [
        t.jSXAttribute(
          t.jSXIdentifier('client'),
          t.stringLiteral('apolloClient')
        ),
      ]),
      t.jSXClosingElement(t.jSXIdentifier('ApolloProvider')),
      [rootJSXElement]
    );

    apolloInit = apolloInitTemplate({
      GRAPHQL_URL: model.project.graphQLEndpointURL,
    });
  }

  const declarations = fileTemplate({
    IMPORTS: imports,
    APOLLO_INIT: apolloInit,
    CONTAINER_ID: t.stringLiteral(containerId),
    JSX: rootJSXElement,
  });

  const fileAST = t.file(t.program(declarations));

  return generate(fileAST).code;
};

module.exports = generateEntryPointFile;