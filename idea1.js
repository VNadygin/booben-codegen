const jssy = require('./jssy.json')
const generate = require('babel-generator').default;

const generateComponent = route => {
  const importAst = []
  const exportAst = []
  const JSXElement = {
    "type": "JSXElement",
    "openingElement": {
      "type": "JSXOpeningElement",
      "attributes": [],
      "name": {
        "type": "JSXIdentifier",
        "name": "div"
      },
      "selfClosing": true
    },
    "closingElement": null,
    "children": [],
  }
  
  const renderAst = {
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
          "argument": JSXElement
        }
      ],
      "directives": []
    }
  }

  const componentAst = {
    "type": "ClassDeclaration",
    "id": {
      "type": "Identifier",
      "name": `Component${route.id}`
    },
    "superClass": {
      "type": "MemberExpression",
      "object": {
        "type": "Identifier",
        "name": "React"
      },
      "property": {
        "type": "Identifier",
        "name": "Component"
      },
      "computed": false
    },
    "body": {
      "type": "ClassBody",
      "body": [
        // constructorAst,
        renderAst
      ]
    }
  }

  return {
    "type": "File",
    "program": {
      "type": "Program",
      "sourceType": "module",
      "body": [
        ...importAst,
        componentAst,
        ...exportAst
      ],
      "directives": []
    }
  }
}

const ast = generateComponent(jssy.routes[0])

const { code } = generate(ast)

console.log(code);
