const prettier = require('prettier');

const prettifyFiles = code => {
  return prettier.format(code, { parser: 'babylon' });
};

module.exports = prettifyFiles;
