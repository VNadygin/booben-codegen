'use strict';

const generate = require('babel-generator').default;
const template = require('babel-template');
const t = require('babel-types');
const generateImportsAST = require('./generateImportsAST');
const generateHandlerAST = require('./generateHandlerAST');
const generateStateAST = require('./generateStateAST');
const generateRefsAST = require('./generateRefsAST');
const generateJSXAST = require('./generateJSXAST');
const generateDataAST = require('./generateDataAST');
const generateLoadingJXSAST = require('./generateLoadingJXSAST');
const prettifyCode = require('./prettifyCode');

const declarationsTemplate = template(
  `
    IMPORTS
    
    class COMPONENT_NAME extends React.Component {
      constructor(props, context) {
        super(props, context);
        STATE
        INIT_REFS
        BIND_SAVE_REFS
        BIND_HANDLERS
      }
      
      // Other methods will be inserted here manually after executing this template
      
      render() {
        LOADING_JSX
        return JSX;
      }
    }

    DATA
    
    COMPONENT_NAME.displayName = COMPONENT_NAME_STRING;
    
    export default EXPORT_EXPRESSION;
  `,
  {
    sourceType: 'module',
    plugins: ['jsx'],
  }
);

/**
 *
 * @param {ComponentFileModel} file
 * @param {BoobenProjectModel} model
 * @param {number} [nestingLevel=0]
 * @return {string}
 */
const generateComponentFile = (file, model, nestingLevel = 0) => {
  const importASTs = generateImportsAST(file, model, nestingLevel);
  const handlersAST = [];
  const handlerBindingsAST = [];

  file.handlers.forEach(handler => {
    const { handlerAST, handlerBindingAST } = generateHandlerAST(
      handler,
      file,
      model
    );

    if (handlerAST && handlerBindingAST) {
      handlersAST.push(handlerAST);
      handlerBindingsAST.push(handlerBindingAST);
    }
  });

  const stateAST = generateStateAST(file, model);
  const { initRefASTs, saveRefASTs, bindSaveRefASTs } = generateRefsAST(file);
  const jsxAST = generateJSXAST(file, model);
  const dataAST = generateDataAST(file, model);

  const exportExpression =
    file.queries.size > 0 || file.mutations.size > 0
      ? t.callExpression(t.identifier('enhance'), [t.identifier(file.name)])
      : t.identifier(file.name);

  const loadingJXSAST = generateLoadingJXSAST(file);

  const declarations = declarationsTemplate({
    IMPORTS: importASTs,
    COMPONENT_NAME: t.identifier(file.name),
    COMPONENT_NAME_STRING: t.stringLiteral(file.name),
    STATE: stateAST || [],
    INIT_REFS: initRefASTs,
    BIND_SAVE_REFS: bindSaveRefASTs,
    BIND_HANDLERS: handlerBindingsAST,
    JSX: jsxAST,
    DATA: dataAST,
    EXPORT_EXPRESSION: exportExpression,
    LOADING_JSX: loadingJXSAST,
  });

  let classDeclaration = null;
  for (let i = 0; i < declarations.length; i++) {
    if (t.isClassDeclaration(declarations[i])) {
      classDeclaration = declarations[i];
      break;
    }
  }

  if (classDeclaration !== null) {
    classDeclaration.body.body.splice(1, 0, ...saveRefASTs, ...handlersAST);
  }

  const fileAST = t.file(t.program(declarations));
  const code = generate(fileAST).code;
  return prettifyCode(code);
};

module.exports = generateComponentFile;
