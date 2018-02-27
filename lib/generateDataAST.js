'use strict';

const t = require('babel-types');
const _ = require('lodash');
const template = require('babel-template');
const { formatQueryNamespace, formatMutationNamespace } = require('./names');

const queryArgsStringTemplate = args => {
  if (args.length === 0) return '';
  const queryArgsStringsArray = args.map(item => `$${item.name}:${item.type}`);
  return `(${queryArgsStringsArray})`;
};

const argsStringTemplate = args => {
  if (args.length === 0) return '';
  const argsStringsArray = args.map(item => `${item.name}:$${item.name}`);
  return `(${argsStringsArray})`;
};

const generateVariablesAST = args => {
  const objectsAST = args.map(item =>
    t.objectProperty(t.identifier(item.name), item.value)
  );

  return t.objectExpression(objectsAST);
};

const parseDeep = (item, acc = '') => {
  if (_.isEmpty(item)) return acc;
  acc += '{';
  acc += Object.keys(item).map(key => {
    if (!_.isEmpty(item[key])) {
      return key + parseDeep(item[key]);
    } else {
      return key;
    }
  });
  acc += '}';

  return acc;
};

const generateDataAST = file => {
  const graphqlDataAST = [];

  file.queries.forEach((body, queryName) => {
    const argsBody = argsStringTemplate(body.args);
    const queryArgsBody = queryArgsStringTemplate(body.args);
    const variablesAst = generateVariablesAST(body.args);

    const queryBody = Object.keys(body.values).map(key => {
      return parseDeep(body.values[key], key);
    });

    const templateBody =
      'gql`' +
      `query` +
      queryArgsBody +
      `{
      ${queryName}` +
      argsBody +
      `{
        ${queryBody}
      }
    }` +
      '`';

    const queryAst = template(`
      graphql(${templateBody}, { name: '${formatQueryNamespace(
      queryName
    )}', options: (props) => ({variables: VARIABLES})})
    `)({
      VARIABLES: variablesAst,
    });
    graphqlDataAST.push(queryAst.expression);
  });

  file.mutations.forEach((body, mutationName) => {
    const mutationArgsBody = queryArgsStringTemplate(body.args);
    const argsBody = argsStringTemplate(body.args);
    const mutationBody = body.values;

    const templateBody =
      'gql`' +
      `mutation` +
      mutationArgsBody +
      `{
      ${mutationName}` +
      argsBody +
      `{
        ${mutationBody}
      }
    }` +
      '`';

    const mutationAst = template(`
      graphql(${templateBody}, { name: '${formatMutationNamespace(
      mutationName
    )}'})
    `)();

    graphqlDataAST.push(mutationAst.expression);
  });

  const dataAst = template(`
    const enhance = compose(
      GRAPHQL_AST
    )
  `)({
    GRAPHQL_AST: graphqlDataAST,
  });
  if (graphqlDataAST.length === 0) {
    return [];
  }
  return dataAst;
};

module.exports = generateDataAST;
