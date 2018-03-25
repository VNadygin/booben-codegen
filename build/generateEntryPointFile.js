/**
 * @author Dmitriy Bizyaev
 */

'use strict';

var generate = require('babel-generator').default;
var t = require('babel-types');
var template = require('babel-template');

var _require = require('./constants'),
    defaultContainerId = _require.defaultContainerId,
    componentsDirectory = _require.componentsDirectory;

var fileTemplate = template('\n    import React from \'react\';\n    import ReactDOM from \'react-dom\';\n    import { Router, Switch, Route, Redirect } from \'react-router\';\n    import { BrowserRouter } from \'react-router-dom\';\n    import \'./styles.js\'\n\n    IMPORTS\n    \n    APOLLO_INIT\n    \n    ReactDOM.render(\n      JSX,\n      document.getElementById(CONTAINER_ID),\n    );\n  ', {
  sourceType: 'module',
  plugins: ['jsx']
});

var apolloInitTemplate = template('\n  const httpLink = createHttpLink({\n    uri: GRAPHQL_URL\n  });\n\n  const token = localStorage.getItem(\'token\');\n\n  const authLink = setContext((_, { headers }) => {\n    let authorization = ""\n\n    if (token) {\n      authorization = "Bearer " + token\n    } \n\n    return {\n      headers: {\n        ...headers,\n        authorization,\n      }\n    }\n  });\n\n  const client = new ApolloClient({\n    link: authLink.concat(httpLink),\n    cache: new InMemoryCache()\n  });\n', {
  sourceType: 'module',
  plugins: ['objectRestSpread']
});

/**
 *
 * @param {JssyProjectModel} model
 * @param {string} [urlPrefix='/']
 * @param {string} [containerId='jssy-app-container']
 * @return {string}
 */
var generateEntryPointFile = function generateEntryPointFile(model) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$urlPrefix = _ref.urlPrefix,
      urlPrefix = _ref$urlPrefix === undefined ? '/' : _ref$urlPrefix,
      _ref$containerId = _ref.containerId,
      containerId = _ref$containerId === undefined ? defaultContainerId : _ref$containerId;

  var imports = [];

  if (model.usingGraphQL) {
    var apolloClientImport = t.importDeclaration([t.importSpecifier(t.identifier('ApolloClient'), t.identifier('ApolloClient'))], t.stringLiteral('apollo-client'));

    var apolloProviderImport = t.importDeclaration([t.importSpecifier(t.identifier('ApolloProvider'), t.identifier('ApolloProvider'))], t.stringLiteral('react-apollo'));

    var createHttpLinkImport = t.importDeclaration([t.importSpecifier(t.identifier('createHttpLink'), t.identifier('createHttpLink'))], t.stringLiteral('apollo-link-http'));

    var inMemoryCache = t.importDeclaration([t.importSpecifier(t.identifier('InMemoryCache'), t.identifier('InMemoryCache'))], t.stringLiteral('apollo-cache-inmemory'));

    var setContext = t.importDeclaration([t.importSpecifier(t.identifier('setContext'), t.identifier('setContext'))], t.stringLiteral('apollo-link-context'));

    imports.push(apolloClientImport);
    imports.push(apolloProviderImport);
    imports.push(createHttpLinkImport);
    imports.push(inMemoryCache);
    imports.push(setContext);
  }

  var routeElements = [];

  model.redirects.forEach(function (redirect) {
    var redirectElement = t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier('Redirect'), [t.jSXAttribute(t.jSXIdentifier('exact')), t.jSXAttribute(t.jSXIdentifier('from'), t.stringLiteral(redirect.from)), t.jSXAttribute(t.jSXIdentifier('to'), t.stringLiteral(redirect.to))], true), null, []);
    if (redirect.type === 'always') {
      routeElements.push(redirectElement);
    } else if (redirect.type === 'hasAuth') {
      routeElements.push(t.jSXExpressionContainer(t.logicalExpression('&&', t.identifier('token'), redirectElement)));
    } else if (redirect.type === 'anonymous') {
      routeElements.push(t.jSXExpressionContainer(t.logicalExpression('&&', t.unaryExpression('!', t.identifier('token')), redirectElement)));
    }
  });

  model.rootRoutes.forEach(function (routeId) {
    var route = model.routes[routeId];
    var routeComponentName = route.file.name;

    var routeElement = t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier('Route'), [t.jSXAttribute(t.jSXIdentifier('path'), t.stringLiteral(route.fullPath)), t.jSXAttribute(t.jSXIdentifier('component'), t.jSXExpressionContainer(t.identifier(routeComponentName)))], true), null, []);

    var pathToComponentFile = './' + componentsDirectory + '/' + routeComponentName + '/' + routeComponentName;

    var importDeclaration = t.importDeclaration([t.importDefaultSpecifier(t.identifier(routeComponentName))], t.stringLiteral(pathToComponentFile));

    routeElements.push(routeElement);
    imports.push(importDeclaration);
  });

  var switchElement = t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier('Switch'), []), t.jSXClosingElement(t.jSXIdentifier('Switch')), routeElements);

  var rootJSXElement = t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier('BrowserRouter'), [t.jSXAttribute(t.jSXIdentifier('basename'), t.stringLiteral(urlPrefix))]), t.jSXClosingElement(t.jSXIdentifier('BrowserRouter')), [switchElement]);

  var apolloInit = [];

  if (model.usingGraphQL) {
    rootJSXElement = t.jSXElement(t.jSXOpeningElement(t.jSXIdentifier('ApolloProvider'), [t.jSXAttribute(t.jSXIdentifier('client'), t.jSXExpressionContainer(t.identifier('client')))]), t.jSXClosingElement(t.jSXIdentifier('ApolloProvider')), [rootJSXElement]);

    apolloInit = apolloInitTemplate({
      GRAPHQL_URL: t.stringLiteral(model.project.graphQLEndpointURL)
    });
  }

  var declarations = fileTemplate({
    IMPORTS: imports,
    APOLLO_INIT: apolloInit,
    CONTAINER_ID: t.stringLiteral(containerId),
    JSX: rootJSXElement
  });

  var fileAST = t.file(t.program(declarations));

  return generate(fileAST).code;
};

module.exports = generateEntryPointFile;
//# sourceMappingURL=generateEntryPointFile.js.map