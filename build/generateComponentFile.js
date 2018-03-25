'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var generate = require('babel-generator').default;
var template = require('babel-template');
var t = require('babel-types');
var generateImportsAST = require('./generateImportsAST');
var generateHandlerAST = require('./generateHandlerAST');
var generateStateAST = require('./generateStateAST');
var generateRefsAST = require('./generateRefsAST');
var generateJSXAST = require('./generateJSXAST');
var generateDataAST = require('./generateDataAST');
var generateLoadingJXSAST = require('./generateLoadingJXSAST');

var declarationsTemplate = template('\n    IMPORTS\n    \n    class COMPONENT_NAME extends React.Component {\n      constructor(props, context) {\n        super(props, context);\n        STATE\n        INIT_REFS\n        BIND_SAVE_REFS\n        BIND_HANDLERS\n      }\n      \n      // Other methods will be inserted here manually after executing this template\n      \n      render() {\n        LOADING_JSX\n        return JSX;\n      }\n    }\n\n    DATA\n    \n    COMPONENT_NAME.displayName = COMPONENT_NAME_STRING;\n    \n    export default EXPORT_EXPRESSION;\n  ', {
  sourceType: 'module',
  plugins: ['jsx']
});

/**
 *
 * @param {ComponentFileModel} file
 * @param {JssyProjectModel} model
 * @param {number} [nestingLevel=0]
 * @return {string}
 */
var generateComponentFile = function generateComponentFile(file, model) {
  var nestingLevel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  var importASTs = generateImportsAST(file, model, nestingLevel);
  var handlersAST = [];
  var handlerBindingsAST = [];

  file.handlers.forEach(function (handler) {
    var _generateHandlerAST = generateHandlerAST(handler, file),
        handlerAST = _generateHandlerAST.handlerAST,
        handlerBindingAST = _generateHandlerAST.handlerBindingAST;

    if (handlerAST && handlerBindingAST) {
      handlersAST.push(handlerAST);
      handlerBindingsAST.push(handlerBindingAST);
    }
  });

  var stateAST = generateStateAST(file, model);

  var _generateRefsAST = generateRefsAST(file),
      initRefASTs = _generateRefsAST.initRefASTs,
      saveRefASTs = _generateRefsAST.saveRefASTs,
      bindSaveRefASTs = _generateRefsAST.bindSaveRefASTs;

  var jsxAST = generateJSXAST(file, model);
  var dataAST = generateDataAST(file, model);

  var exportExpression = file.queries.size > 0 || file.mutations.size > 0 ? t.callExpression(t.identifier('enhance'), [t.identifier(file.name)]) : t.identifier(file.name);

  var loadingJXSAST = generateLoadingJXSAST(file);

  var declarations = declarationsTemplate({
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
    LOADING_JSX: loadingJXSAST
  });

  var classDeclaration = null;
  for (var i = 0; i < declarations.length; i++) {
    if (t.isClassDeclaration(declarations[i])) {
      classDeclaration = declarations[i];
      break;
    }
  }

  if (classDeclaration !== null) {
    var _classDeclaration$bod;

    (_classDeclaration$bod = classDeclaration.body.body).splice.apply(_classDeclaration$bod, [1, 0].concat(_toConsumableArray(saveRefASTs), handlersAST));
  }

  var fileAST = t.file(t.program(declarations));

  return generate(fileAST).code;
};

module.exports = generateComponentFile;
//# sourceMappingURL=generateComponentFile.js.map