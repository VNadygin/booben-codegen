const babelTemplate = require("babel-template")
const generate = require("babel-generator").default
const t = require("babel-types")

const template = code => {
  return babelTemplate(code, {
    sourceType: "module",
    plugins: [
      "objectRestSpread",
    ]
   })
}

const generateFunctions = model => {
  const ast = Object.keys(model).map((key) => {
    const funcModel = model[key]
    const argsLen = funcModel.args.length;
    const ARGS = funcModel.args.map((arg, i) => {
      
      if (argsLen === i + 1 && funcModel.spreadLastArg ) {
        return t.restElement(t.identifier(arg.name))
      }

      if (typeof arg.defaultValue === 'string') {
        return template(`${arg.name} = "${arg.defaultValue}"`)().expression
      }

      return template(`${arg.name} = ${arg.defaultValue}`)().expression
    })
    return template(`
      function ${key}(ARGS) {
        ${funcModel.body}
      }
    `)({ARGS})
  })
  const file = {
    "type": "File",
    "program": {
      "type": "Program",
      "sourceType": "module",
      "body": ast
    }
  }
  
  return generate(file).code;
}

module.exports = generateFunctions

