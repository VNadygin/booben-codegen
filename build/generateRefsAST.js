/**
 * @author Dmitriy Bizyaev
 */

'use strict';

var t = require('babel-types');

var _require = require('./names'),
    formatComponentRefKey = _require.formatComponentRefKey,
    formatComponentSaveRefMethodName = _require.formatComponentSaveRefMethodName;

/**
 *
 * @param {ComponentFileModel} file
 * @return {{ initRefASTs: Array<ExpressionStatement>, saveRefASTs: Array<ClassMethod>, bindSaveRefASTs: Array<ExpressionStatement> }}
 */


var generateRefsAST = function generateRefsAST(file) {
  var initRefASTs = [];
  var saveRefASTs = [];
  var bindSaveRefASTs = [];

  file.refs.forEach(function (componentId) {
    var component = file.components[componentId];
    var refKey = formatComponentRefKey(component);
    var methodName = formatComponentSaveRefMethodName(component);

    // this./*refKey*/ = null;
    var initRefAST = t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.thisExpression(), t.identifier(refKey)), t.nullLiteral()));

    // /*methodName*/(ref) {
    //   this./*refKey*/ = ref;
    // }
    var saveRefAST = t.classMethod('method', t.identifier(methodName), [t.identifier('ref')], t.blockStatement([t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.thisExpression(), t.identifier(refKey)), t.identifier('ref')))]));

    // this./*methodName*/ = this./*methodName*/.bind(this);
    var bindSaveRefAST = t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.thisExpression(), t.identifier(methodName)), t.callExpression(t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier(methodName)), t.identifier('bind')), [t.thisExpression()])));

    initRefASTs.push(initRefAST);
    saveRefASTs.push(saveRefAST);
    bindSaveRefASTs.push(bindSaveRefAST);
  });

  return { initRefASTs: initRefASTs, saveRefASTs: saveRefASTs, bindSaveRefASTs: bindSaveRefASTs };
};

module.exports = generateRefsAST;
//# sourceMappingURL=generateRefsAST.js.map