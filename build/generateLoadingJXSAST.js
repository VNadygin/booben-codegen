'use strict';

var template = require('babel-template');

var _require = require('./names'),
    formatQueryNamespace = _require.formatQueryNamespace;

var generateLoadingJXSAST = function generateLoadingJXSAST(file) {
  var loadingJSXAST = [];

  if (file.queries.size > 0) {
    file.queries.forEach(function (item, key) {
      var ast = template('\n        if (this.props.' + formatQueryNamespace(key) + '.loading) return null\n      ')();
      loadingJSXAST.push(ast);
    });
    return loadingJSXAST;
  }
  return [];
};

module.exports = generateLoadingJXSAST;
//# sourceMappingURL=generateLoadingJXSAST.js.map