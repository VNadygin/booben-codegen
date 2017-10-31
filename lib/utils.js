const { gatherMetadata } = require('@jssy/metadata');

const metadata = async path => {
  const fullPath = `node_module/` + path
  const result = await gatherMetadata(fullPath)
  return result
}

module.exports = {
  metadata
}