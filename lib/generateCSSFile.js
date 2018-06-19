const generate = require('babel-generator').default;
const t = require('babel-types');
const template = require('babel-template');

const { formatStyleClassName } = require('./names');

const generateCSSFile = model => {
  const css = [];
  model.files.forEach(file => {
    file.css.forEach((item, componentId) => {
      const className = formatStyleClassName(file.name, componentId);
      css.push(`.${className}{${item}}`);
    });
  });
  const cssString = css.join('\n');

  // eslint-disable-next-line no-useless-concat
  const injectGlobalBody = 'injectGlobal' + '`' + cssString + '`';

  const fileTemplate = template(
    `
    import { injectGlobal } from 'styled-components';
    ${injectGlobalBody}
  `,
    {
      sourceType: 'module',
      plugins: ['jsx'],
    }
  )();

  return generate(t.file(t.program(fileTemplate))).code;
};

module.exports = generateCSSFile;
