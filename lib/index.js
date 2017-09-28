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
    case is.object(value):
      const properties = Object.keys(value).map(key => {
        
        const astValue = generateLiteral(value[key])
        return generateObjectProperty(key, astValue)
      });
      return generateObject(properties)
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
    
    return generateArray(value.map(jsValueToAst))
  } else if (is.object(value) ) {
    
    const properties = Object.keys(value).map(key => {
      const astValue = jsValueToAst(value[key])
      return generateObjectProperty(key, astValue)
   });
   
    return generateObject(properties)
  } else {
    return generateLiteral(value)
  }
}

const constJsValueToAst = ({sourceData}) => {
  const value = sourceData.value

  
  if (is.array(value)) {
    return generateArray(value.map(generateLiteral))
  } else if (is.object(value) ) {
  
    const properties = Object.keys(value).map(key => {
      
      const astValue = generateLiteral(value[key])

      
      return generateObjectProperty(key, astValue)
    });
      return generateObject(properties)
  } else {
    return generateLiteral(value)
  }
}

const routeParamsJsValueToAst = ({sourceData}) => {
  
  const props = generateIdentifier('props')
  const match = generateIdentifier('match')
  const params = generateIdentifier('params')
  const paramName = generateIdentifier(sourceData.paramName)

  const propsMatch = generateMemberExpression(props, match)
  const propsMatchParams = generateMemberExpression(propsMatch, params)
  const propsMatchParamsName = generateMemberExpression(propsMatchParams, paramName)

  return propsMatchParamsName
}

const jsValueToAst = value => {
  const source = value.source

  if (source === 'static') {
    return staticJsValueToAst(value)
  } else if (source === 'const') {
    return constJsValueToAst(value)
  } else if (source === 'routeParams') {
    return routeParamsJsValueToAst(value)
  } else {
    console.log('wrong');
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
    const value = jsValueToAst(props[key])
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


const generateMemberExpression = (object, property) => ({
  "type": "MemberExpression",
  "object": object,
  "property": property,
  "computed": false
})



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
