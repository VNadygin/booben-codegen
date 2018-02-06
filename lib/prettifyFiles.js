const { exec } = require('mz/child_process');

const prettifyFiles = async () => {
  await exec(
    'prettier --single-quote --trailing-comma es5 --write "{bundle,__{tests,mocks}__}/**/*.js"'
  );
};

module.exports = prettifyFiles;
