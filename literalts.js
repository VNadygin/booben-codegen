const is = require('is_js')

const generateString = value => ({
  "type": "StringLiteral",
  "value": value
})

const generateBoolean = value => ({
  "type": "BooleanLiteral",
  "value": value
})

const generateNumber = value => ({
  "type": "NumericLiteral",
  "value": value
})

const generateNull = () => ({
  "type": "NullLiteral"
})

const generateIdentifier = name => ({
  "type": "Identifier",
  "name": name
})

const generateLiteral = value => {
  switch (true) {
    case is.string(value):
      return generateString(value)
    case is.boolean(value):
      return generateBoolean(value)
    case is.number(value):
      return generateNumber(value)
    case is.null(value): 
      return generateNull()
    default:
      return generateIdentifier('undefined')
  }
}

const generateObjectProperty = (key, value) => ({
  "type": "ObjectProperty",
  "key": generateIdentifier(key),
  "value": value
})

const generateArray = (elements=[]) => ({
  "type": "ArrayExpression",
  "elements": elements
})

const generateObject = (properties=[]) => ({
  "type": "ObjectExpression",
  "properties": properties
})

module.exports = {
  generateLiteral,
  generateObjectProperty,
  generateObject,
  generateArray
}
