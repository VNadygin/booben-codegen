/**
 * @author Dmitriy Bizyaev
 */

const t = require('babel-types');

const {
  formatComponentRefKey,
  formatComponentSaveRefMethodName,
} = require('./names');

/**
 *
 * @param {ComponentFileModel} file
 * @return {{ initRefASTs: Array<ExpressionStatement>, saveRefASTs: Array<ClassMethod>, bindSaveRefASTs: Array<ExpressionStatement> }}
 */
const generateRefsAST = file => {
  const initRefASTs = [];
  const saveRefASTs = [];
  const bindSaveRefASTs = [];

  file.refs.forEach(componentId => {
    const component = file.components[componentId];
    const refKey = formatComponentRefKey(component);
    const methodName = formatComponentSaveRefMethodName(component);

    // this./*refKey*/ = null;
    const initRefAST = t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(t.thisExpression(), t.identifier(refKey)),
        t.nullLiteral()
      )
    );

    // /*methodName*/(ref) {
    //   this./*refKey*/ = ref;
    // }
    const saveRefAST = t.classMethod(
      'method',
      t.identifier(methodName),
      [t.identifier('ref')],
      t.blockStatement([
        t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(t.thisExpression(), t.identifier(refKey)),
            t.identifier('ref')
          )
        ),
      ])
    );

    // this./*methodName*/ = this./*methodName*/.bind(this);
    const bindSaveRefAST = t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(t.thisExpression(), t.identifier(methodName)),
        t.callExpression(
          t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier(methodName)),
            t.identifier('bind')
          ),
          [t.thisExpression()]
        )
      )
    );

    initRefASTs.push(initRefAST);
    saveRefASTs.push(saveRefAST);
    bindSaveRefASTs.push(bindSaveRefAST);
  });

  return { initRefASTs, saveRefASTs, bindSaveRefASTs };
};

module.exports = generateRefsAST;
