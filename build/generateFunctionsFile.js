'use strict';

var template = require('babel-template');
var generate = require('babel-generator').default;
var t = require('babel-types');

var generateFunctionsFile = function generateFunctionsFile(functions) {
  var functionDeclarations = Object.keys(functions).map(function (key) {
    var funcModel = functions[key];
    var argsLen = funcModel.args.length;
    var ARGS = funcModel.args.map(function (arg, i) {
      if (argsLen === i + 1 && funcModel.spreadLastArg) {
        return t.restElement(t.identifier(arg.name));
      }

      if (typeof arg.defaultValue === 'string') {
        return template(arg.name + ' = "' + arg.defaultValue + '"')().expression;
      }

      return template(arg.name + ' = ' + arg.defaultValue)().expression;
    });

    return template('\n        export function ' + key + '(ARGS) {\n          ' + funcModel.body + '\n        }\n      ', { sourceType: 'module' })({ ARGS: ARGS });
  });

  var file = t.file(t.program(functionDeclarations));

  return generate(file).code;
};

module.exports = generateFunctionsFile;
//# sourceMappingURL=generateFunctionsFile.js.map