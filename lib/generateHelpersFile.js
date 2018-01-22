'use strict';

const template = require('babel-template');
const generate = require('babel-generator').default;
const t = require('babel-types');

const generateHelpersFile = helpers => {
  const helpersDeclarations = [];

  if (helpers.openUrl) {
    helpersDeclarations.push(
      template(
        `
        export const operUrl = (url, newWindow) => {
          if (newWindow) {
            window.location.href = url;
          } else {
            window.open(url);
          }
        }
      `,
        { sourceType: 'module' }
      )()
    );
  }

  const file = t.file(t.program(helpersDeclarations));

  return generate(file).code;
};

module.exports = generateHelpersFile;
