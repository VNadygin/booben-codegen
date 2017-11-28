'use strict';

const template = require('babel-template');
const generate = require('babel-generator').default;
const t = require('babel-types');

const generateFunctionsFile = functions => {
  const functionDeclarations = Object.keys(functions).map(key => {
    const funcModel = functions[key];
    const argsLen = funcModel.args.length;
    const ARGS = funcModel.args.map((arg, i) => {
      if (argsLen === i + 1 && funcModel.spreadLastArg) {
        return t.restElement(t.identifier(arg.name));
      }

      if (typeof arg.defaultValue === 'string') {
        return template(`${arg.name} = "${arg.defaultValue}"`)().expression;
      }

      return template(`${arg.name} = ${arg.defaultValue}`)().expression;
    });

    return template(
      `
        export function ${key}(ARGS) {
          ${funcModel.body}
        }
      `,
      { sourceType: 'module' }
    )({ ARGS });
  });

  const file = t.file(t.program(functionDeclarations));

  return generate(file).code;
};

module.exports = generateFunctionsFile;
