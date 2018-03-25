'use strict';

var generate = require('babel-generator').default;
var t = require('babel-types');
var template = require('babel-template');

var _require = require('./names'),
    formatStyleClassName = _require.formatStyleClassName;

var generateCSSFile = function generateCSSFile(model) {
  var css = [];
  model.files.forEach(function (file) {
    file.css.forEach(function (item, componentId) {
      var className = formatStyleClassName(file.name, componentId);
      css.push('.' + className + '{' + item + '}');
    });
  });
  var cssString = css.join('\n');

  var injectGlobalBody = 'injectGlobal' + '`' + cssString + '`';

  var fileTemplate = template('\n    import { injectGlobal } from \'styled-components\';\n    ' + injectGlobalBody + '\n  ', {
    sourceType: 'module',
    plugins: ['jsx']
  })();

  return generate(t.file(t.program(fileTemplate))).code;
};

module.exports = generateCSSFile;
//# sourceMappingURL=generateCSSFile.js.map