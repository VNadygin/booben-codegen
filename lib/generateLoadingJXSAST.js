const template = require('babel-template');
const { formatQueryNamespace } = require('./names');

const generateLoadingJXSAST = file => {
  const loadingJSXAST = [];

  if (file.queries.size > 0) {
    file.queries.forEach((item, key) => {
      const ast = template(`
        if (this.props.${formatQueryNamespace(key)}.loading) return null
      `)();
      loadingJSXAST.push(ast);
    });
    return loadingJSXAST;
  }
  return [];
};

module.exports = generateLoadingJXSAST;
