/**
 * @author Dmitriy Bizyaev
 */

const t = require('babel-types');
const { functionsFile } = require('./constants');

/**
 *
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @return {Array<ImportDeclaration>}
 */
const generateImportsAST = (file, model) => {
  const ret = [];

  const reactImportDeclaration = t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier('React'))],
    t.stringLiteral('react')
  );

  ret.push(reactImportDeclaration);

  file.importComponents.forEach((componentNames, namespace) => {
    const libMeta = model.meta[namespace];

    const importDeclaration = t.importDeclaration(
      Array.from(componentNames).map(name =>
        t.importSpecifier(t.identifier(name), t.identifier(name))
      ),
      t.stringLiteral(libMeta.moduleName)
    );

    ret.push(importDeclaration);
  });

  const functionsImportDeclaration = t.importDeclaration(
    Array.from(file.importProjectFunctions).map(name =>
      t.importSpecifier(t.identifier(name), t.identifier(name))
    ),
    t.stringLiteral(`../${functionsFile}`)
  );

  ret.push(functionsImportDeclaration);

  return ret;
};

module.exports = generateImportsAST;
