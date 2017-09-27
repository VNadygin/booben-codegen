const generate = require('babel-generator').default;
const is = require('is_js')
const {
  generateLiteral,
  generateObjectProperty,
  generateObject,
  generateArray
} = require('./literalts')



const jssyValue = {
  source: "static",
  sourceData: {
    value: {
      property1: { source: "static", sourceData: { value: "foo" } },
  }
}
}

const ast = staticJsValueToAst(jssyValue)
const {code } = generate(ast)

// console.log(code)