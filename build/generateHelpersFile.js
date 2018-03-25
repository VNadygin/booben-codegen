'use strict';

var template = require('babel-template');
var generate = require('babel-generator').default;
var t = require('babel-types');

var generateHelpersFile = function generateHelpersFile(helpers) {
  var helpersDeclarations = [];

  if (helpers.openUrl) {
    helpersDeclarations.push(template('\n        export const operUrl = (url, newWindow) => {\n          if (newWindow) {\n            window.location.href = url;\n          } else {\n            window.open(url);\n          }\n        }\n      ', { sourceType: 'module' })());
  }

  var file = t.file(t.program(helpersDeclarations));

  return generate(file).code;
};

module.exports = generateHelpersFile;
//# sourceMappingURL=generateHelpersFile.js.map