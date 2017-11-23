const npa = require('npm-package-arg');
const { gatherMetadata } = require('@jssy/metadata');

const getMetadata = async (componentLibs, outputDir) => {
  const metadata = {};

  for (let i = 0; i < componentLibs.length; i++) {
    const { name } = npa(componentLibs[i]);
    const path = `${outputDir}/node_modules/${name}`;
    const meta = await gatherMetadata(path);
    metadata[meta.namespace] = meta;
  }

  return metadata;
};

module.exports = getMetadata;
