
const initFile = body => ({
  "type": "File",
  "program": {
    "type": "Program",
    "sourceType": "module",
    "body": body
  }
})

const generateBrowserRouter = (children) => ({
  "type": "JSXElement",
  "openingElement": {
    "type": "JSXOpeningElement",
    "attributes": [],
    "name": {
      "type": "JSXIdentifier",
      "name": "BrowserRouter"
    },
    "selfClosing": false
  },
  "closingElement": {
    "type": "JSXClosingElement",
    "name": {
      "type": "JSXIdentifier",
      "name": "BrowserRouter"
    }
  },
  "children": children
})

const generateSwitch = (children) => ({
  "type": "JSXElement",
  "openingElement": {
    "type": "JSXOpeningElement",
    "attributes": [],
    "name": {
      "type": "JSXIdentifier",
      "name": "Switch"
    },
    "selfClosing": false
  },
  "closingElement": {
    "type": "JSXClosingElement",
    "name": {
      "type": "JSXIdentifier",
      "name": "Switch"
    }
  },
  "children": children
})

const generateRoute = ({path, component, isExact}) => {
  
  
   const expression = (component === null )
     ? { "type": "NullLiteral", }
     : { "type": "Identifier", "name": component }
  
 
   return {
     "type": "JSXElement",
     "openingElement": {
       "type": "JSXOpeningElement",
       "attributes": [
         {
           "type": "JSXAttribute",
           "name": {
             "type": "JSXIdentifier",
             "name": "path"
           },
           "value": {
             "type": "StringLiteral",
             "extra": null,
             "value": path
           }
         },
         {
           "type": "JSXAttribute",
           "name": {
             "type": "JSXIdentifier",
             "name": "exact"
           },
           "value": {
             "type": "JSXExpressionContainer",
             "expression": {
               "type": "BooleanLiteral",
               "value": isExact
             }
           }
         },
         {
           "type": "JSXAttribute",
           "name": {
             "type": "JSXIdentifier",
             "name": "component"
           },
           "value": {
             "type": "JSXExpressionContainer",
             "expression": expression
           }
         }
       ],
       "name": {
         "type": "JSXIdentifier",
         "name": "Route"
       },
       "selfClosing": true
     },
     "closingElement": null,
     "children": []
   }
 }

const generateImportDefault = ({identifier, source }) => ({
  "type": "ImportDeclaration",
  "specifiers": [
    {
      "type": "ImportDefaultSpecifier",
      "local": {
        "type": "Identifier",
        "name": identifier
      }
    }
  ],
  "importKind": "value",
  "source": {
    "type": "StringLiteral",
    "value": source
  }
})

const generateImport = ({specifiers, source}) => {
  const specifiersAst = specifiers.map($0 => ({
    "type": "ImportSpecifier",
    "imported": {
      "type": "Identifier",
      "name": $0
    },
    "importKind": null,
    "local": {
      "type": "Identifier",
      "name": $0
    }
  }))
  
  return {
    "type": "ImportDeclaration",
    "specifiers": specifiersAst,
    "importKind": "value",
    "source": {
      "type": "StringLiteral",
      "value": "react-router-dom"
    }
  }
}

const generateStatelessComponent = ({identifier, body}) => ({
  "type": "VariableDeclaration",
  "declarations": [
    {
      "type": "VariableDeclarator",
      "id": {
        "type": "Identifier",
        "name": identifier
      },
      "init": {
        "type": "ArrowFunctionExpression",
        "id": null,
        "generator": false,
        "expression": true,
        "async": false,
        "params": [
          {
            "type": "Identifier",
            "name": "props"
          }
        ],
        "body": body
      }
    }
  ],
  "kind": "const"
})

const generateExprort = ({ identifier }) => ({
  "type": "ExportDefaultDeclaration",
  "declaration": {
    "type": "Identifier",
    "name": identifier
  }
})

const generateJSXElement = ({identifier, children }) => {
  return {
    "type": "JSXElement",
    "openingElement": {
      "type": "JSXOpeningElement",
      "attributes": [],
      "name": {
        "type": "JSXIdentifier",
        "name": identifier
      },
      "selfClosing": false
    },
    "closingElement": {
      "type": "JSXClosingElement",
      "name": {
        "type": "JSXIdentifier",
        "name": identifier
      }
    },
    "children": children
  }
}

module.exports = {
  initFile,
  generateBrowserRouter,
  generateSwitch,
  generateRoute,
  generateImportDefault,
  generateImport,
  generateStatelessComponent,
  generateExprort,
  generateJSXElement
}