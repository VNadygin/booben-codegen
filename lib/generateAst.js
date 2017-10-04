const fse = require('fs-extra')
const jssy = require('../jssy.json')

const saveFile = async (path, content) => {
  await fse.outputFile(path, content)
  console.log('done')
}

const generatePackageContent = () => {
  return `{
    "name": "App"
  }`
}

const packageContent = generatePackageContent()


saveFile('app/package.json', packageContent)

