const is = require('is_js')
const generate = require('babel-generator').default;

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

const generateObject = (properties=[]) => ({
  "type": "ObjectExpression",
  "properties": properties
})

const generateArray = (elements=[]) => ({
  "type": "ArrayExpression",
  "elements": elements
})

const staticJsValueToAst = ({sourceData}) => {
  const value = sourceData.value
  if (is.array(value)) {
    
    return generateArray(value.map(staticJsValueToAst))
  } else if (is.object(value) ) {
    
    const properties = Object.keys(value).map(key => {
      const astValue = staticJsValueToAst(value[key])
      return generateObjectProperty(key, astValue)
   });
   
    return generateObject(properties)
  } else {
    return generateLiteral(value)
  }
}

const generateAttribute = (name, value) => {
  if (value.type === 'StringLiteral') {
    return {
      "type": "JSXAttribute",
      "name": {
        "type": "JSXIdentifier",
        "name": name
      },
      "value": value
    }
  } else {
      return {
        "type": "JSXAttribute",
        "name": {
          "type": "JSXIdentifier",
          "name": name
        },
        "value": {
          "type": "JSXExpressionContainer",
          "expression": value
        }
      }
    }
  }


const generateJSX = ({name, props, children}) => {
  //TODO: get correct name
  //TODO: staticJSValue, add another JSValue
  const attributes = Object.keys(props).map(key => {
    const value = staticJsValueToAst(props[key])
    return generateAttribute(key, value)
  })
  
  return {
    "type": "ExpressionStatement",
    "expression": {
      "type": "JSXElement",
      "openingElement": {
        "type": "JSXOpeningElement",
        "attributes": attributes,
        "name": {
          "type": "JSXIdentifier",
          "name": name
        },
        "selfClosing": false
      },
      "closingElement": {
        "type": "JSXClosingElement",
        "name": {
          "type": "JSXIdentifier",
          "name": name
        }
      },
      "children": children
    }
  }
}
const jssy = {
  "id": 0,
  "name": "Reactackle.App",
  "title": "",
  "isWrapper": false,
  "props": {
    "fixed": {
      "source": "static",
      "sourceData": {
        "value": "some text"
      }
    }
  },
  children: []
}

const ast = generateJSX(jssy)

const { code } = generate(ast)
console.log(code);


module.exports = {
  generateString,
  generateBoolean,
  generateNumber,
  generateNull,
  generateIdentifier,
  generateLiteral,
  generateObjectProperty,
  generateObject,
  generateArray,
  staticJsValueToAst,
  generateAttribute,
  generateJSX
}
