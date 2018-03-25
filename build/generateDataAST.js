'use strict';

var t = require('babel-types');
var _ = require('lodash');
var template = require('babel-template');

var _require = require('./names'),
    formatQueryNamespace = _require.formatQueryNamespace,
    formatMutationNamespace = _require.formatMutationNamespace;

var queryArgsStringTemplate = function queryArgsStringTemplate(args) {
  if (args.length === 0) return '';
  var queryArgsStringsArray = args.map(function (item) {
    return '$' + item.name + ':' + item.type;
  });
  return '(' + queryArgsStringsArray + ')';
};

var argsStringTemplate = function argsStringTemplate(args) {
  if (args.length === 0) return '';
  var argsStringsArray = args.map(function (item) {
    return item.name + ':$' + item.name;
  });
  return '(' + argsStringsArray + ')';
};

var generateVariablesAST = function generateVariablesAST(args) {
  var objectsAST = args.map(function (item) {
    return t.objectProperty(t.identifier(item.name), item.value);
  });

  return t.objectExpression(objectsAST);
};

var parseDeep = function parseDeep(item) {
  var acc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  if (_.isEmpty(item)) return acc;
  acc += '{';
  acc += Object.keys(item).map(function (key) {
    if (!_.isEmpty(item[key])) {
      return key + parseDeep(item[key]);
    } else {
      return key;
    }
  });
  acc += '}';

  return acc;
};

var generateDataAST = function generateDataAST(file) {
  var graphqlDataAST = [];

  file.queries.forEach(function (body, queryName) {
    var argsBody = argsStringTemplate(body.args);
    var queryArgsBody = queryArgsStringTemplate(body.args);
    var variablesAst = generateVariablesAST(body.args);

    var queryBody = Object.keys(body.values).map(function (key) {
      return parseDeep(body.values[key], key);
    });

    var templateBody = 'gql`' + 'query' + queryArgsBody + ('{\n      ' + queryName) + argsBody + ('{\n        ' + queryBody + '\n      }\n    }') + '`';

    var queryAst = template('\n      graphql(' + templateBody + ', { name: \'' + formatQueryNamespace(queryName) + '\', options: (props) => ({variables: VARIABLES})})\n    ')({
      VARIABLES: variablesAst
    });
    graphqlDataAST.push(queryAst.expression);
  });

  file.mutations.forEach(function (body, mutationName) {
    var mutationArgsBody = queryArgsStringTemplate(body.args);
    var argsBody = argsStringTemplate(body.args);
    var mutationBody = body.values;

    var templateBody = 'gql`' + 'mutation' + mutationArgsBody + ('{\n      ' + mutationName) + argsBody + ('{\n        ' + mutationBody + '\n      }\n    }') + '`';

    var mutationAst = template('\n      graphql(' + templateBody + ', { name: \'' + formatMutationNamespace(mutationName) + '\'})\n    ')();

    graphqlDataAST.push(mutationAst.expression);
  });

  var dataAst = template('\n    const enhance = compose(\n      GRAPHQL_AST\n    )\n  ')({
    GRAPHQL_AST: graphqlDataAST
  });
  if (graphqlDataAST.length === 0) {
    return [];
  }
  return dataAst;
};

module.exports = generateDataAST;
//# sourceMappingURL=generateDataAST.js.map