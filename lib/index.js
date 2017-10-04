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

const generateThis = () => ({
  "type": "ThisExpression"
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
    case is.array(value):
      return generateArray(value.map(generateLiteral))
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
  return generateLiteral(value)
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

const actionJsValueToAst = (component) => {
  const object = generateThis()
  const property = generateIdentifier(`handleComponentAction${component.id}`)
  return generateMemberExpression(object, property)
  
}


const jsValueToAst = (value, component) => {
  const source = value.source
  if (source === 'static') {
    return staticJsValueToAst(value)
  } else if (source === 'const') {
    return constJsValueToAst(value)
  } else if (source === 'routeParams') {
    return routeParamsJsValueToAst(value)
  } else if (source === 'actions') {
    return actionJsValueToAst(component)
  } else {
    throw new Error('Some shit happened')
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


const generateJSXElement = (component) => {
  const { id, name, props, children } = component
  //TODO: get correct name
  //TODO: staticJSValue, add another JSValue
  const attributes = Object.keys(props).map(key => {
    const value = jsValueToAst(props[key], component)
    
    return generateAttribute(key, value)
  })
  
  return {
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
      "children": children.map(generateJSXElement)
    }
}

const generateJSX = componentJson => {
  return {
    "type": "ExpressionStatement",
    "expression": generateJSXElement(componentJson)
  }
}

const generateMemberExpression = (object, property) => ({
  "type": "MemberExpression",
  "object": object,
  "property": property,
  "computed": false
})

const generateMethodByType = ({type, params}) => {
  if (type === 'url') {
    return generateMethodUrl(params)
  }
}

const generateMethodUrl = ({newWindow, url}) => {
  
  if (newWindow) {
    return {
      "type": "ExpressionStatement",
      "expression": {
        "type": "CallExpression",
        "callee": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "window"
          },
          "property": {
            "type": "Identifier",
            "name": "open"
          },
          "computed": false
        },
        "arguments": [
          {
            "type": "StringLiteral",
            "value": url
          }
        ]
      }
    }
  } else {
    return {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "window"
            },
            "property": {
              "type": "Identifier",
              "name": "location"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "href"
          },
          "computed": false
        },
        "right": {
          "type": "StringLiteral",
          "value": url
        }
      }
    }
  }
}


const generateMethodAst = (sourceData, component) => {
  
  const identifier = `handleComponentAction${component.id}`
  
  return {
    "type": "ExpressionStatement",
    "expression": {
      "type": "AssignmentExpression",
      "operator": "=",
      "left": {
        "type": "MemberExpression",
        "object": {
          "type": "ThisExpression",
        },
        "property": {
          "type": "Identifier",
          "name": identifier
        },
        "computed": false
      },
      "right": {
        "type": "ArrowFunctionExpression",
        "id": null,
        "generator": false,
        "expression": true,
        "async": false,
        "params": [],
          "body": {
            "type": "BlockStatement",
            "body": [
              ...sourceData.actions.map(generateMethodByType)
            ],
            "directives": []
          }
      }
    }
  }
}

const generateMethods = (component) => {
  const { id, name, props, children } = component
  const attributes = Object.keys(props).map(key => {

    if (props[key].source === 'actions') {
     return generateMethodAst(props[key].sourceData, component)
    }
  })
  return attributes
}

const generateComponent = route => {
  const methods = []

  return {
    "type": "ClassDeclaration",
    "id": {
      "type": "Identifier",
      "name": `Component${route.id}`
    },
    "superClass": {
      "type": "Identifier",
      "name": "React.Component"
    },
    "body": {
      "type": "ClassBody",
      "body": [
        {
          "type": "ClassMethod",
          "static": false,
          "computed": false,
          "key": {
            "type": "Identifier",
            "name": "constructor"
          },
          "kind": "constructor",
          "id": null,
          "generator": false,
          "expression": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "props"
            },
            {
              "type": "Identifier",
              "name": "context"
            }
          ],
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Super",
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "props"
                    },
                    {
                      "type": "Identifier",
                      "name": "context"
                    }
                  ]
                }
              },
              // state,
              ...generateMethods(route.component)
            ]
          }
        },
        {
          "type": "ClassMethod",
          "static": false,
          "computed": false,
          "key": {
            "type": "Identifier",
            "name": "render"
          },
          "kind": "method",
          "id": null,
          "generator": false,
          "expression": false,
          "async": false,
          "params": [],
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ReturnStatement",
                "argument": generateJSXElement(route.component)
              },
            ]
          }
        },
      ]
    }
  }
}



// const ast = generateJSXElement(jssy)

// const { code } = generate(ast)

// console.log(code);



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
  generateJSX,
  generateJSXElement,
  generateComponent
}
