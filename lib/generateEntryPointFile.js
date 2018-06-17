'use strict';

const generate = require('babel-generator').default;
const t = require('babel-types');
const template = require('babel-template');
const { defaultContainerId, componentsDirectory } = require('./constants');

const fileTemplate = template(
  `
    import React from 'react';
    import ReactDOM from 'react-dom';
    import { Router, Switch, Route, Redirect } from 'react-router';
    import { BrowserRouter } from 'react-router-dom';
    import './styles.js'

    IMPORTS
    
    APOLLO_INIT
    
    ReactDOM.render(
      JSX,
      document.getElementById(CONTAINER_ID),
    );
  `,
  {
    sourceType: 'module',
    plugins: ['jsx'],
  }
);

const apolloInitTemplate = template(
  `
  const httpLink = createHttpLink({
    uri: GRAPHQL_URL
  });

  const token = localStorage.getItem('token');

  const authLink = setContext((_, { headers }) => {
    let authorization = ""

    if (token) {
      authorization = "Bearer " + token
    } 

    return {
      headers: {
        ...headers,
        authorization,
      }
    }
  });

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  });
`,
  {
    sourceType: 'module',
    plugins: ['objectRestSpread'],
  }
);

/**
 *
 * @param {BoobenProjectModel} model
 * @param {string} [urlPrefix='/']
 * @param {string} [containerId='booben-app-container']
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

    const createHttpLinkImport = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier('createHttpLink'),
          t.identifier('createHttpLink')
        ),
      ],
      t.stringLiteral('apollo-link-http')
    );

    const inMemoryCache = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier('InMemoryCache'),
          t.identifier('InMemoryCache')
        ),
      ],
      t.stringLiteral('apollo-cache-inmemory')
    );

    const setContext = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier('setContext'),
          t.identifier('setContext')
        ),
      ],
      t.stringLiteral('apollo-link-context')
    );

    imports.push(apolloClientImport);
    imports.push(apolloProviderImport);
    imports.push(createHttpLinkImport);
    imports.push(inMemoryCache);
    imports.push(setContext);
  }

  const routeElements = [];

  model.redirects.forEach(redirect => {
    const redirectElement = t.jSXElement(
      t.jSXOpeningElement(
        t.jSXIdentifier('Redirect'),
        [
          t.jSXAttribute(t.jSXIdentifier('exact')),
          t.jSXAttribute(
            t.jSXIdentifier('from'),
            t.stringLiteral(redirect.from)
          ),
          t.jSXAttribute(t.jSXIdentifier('to'), t.stringLiteral(redirect.to)),
        ],
        true
      ),
      null,
      []
    );
    if (redirect.type === 'always') {
      routeElements.push(redirectElement);
    } else if (redirect.type === 'hasAuth') {
      routeElements.push(
        t.jSXExpressionContainer(
          t.logicalExpression('&&', t.identifier('token'), redirectElement)
        )
      );
    } else if (redirect.type === 'anonymous') {
      routeElements.push(
        t.jSXExpressionContainer(
          t.logicalExpression(
            '&&',
            t.unaryExpression('!', t.identifier('token')),
            redirectElement
          )
        )
      );
    }
  });

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

    const pathToComponentFile = `./${componentsDirectory}/${routeComponentName}/${routeComponentName}`;

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
          t.jSXExpressionContainer(t.identifier('client'))
        ),
      ]),
      t.jSXClosingElement(t.jSXIdentifier('ApolloProvider')),
      [rootJSXElement]
    );

    apolloInit = apolloInitTemplate({
      GRAPHQL_URL: t.stringLiteral(model.project.graphQLEndpointURL),
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
