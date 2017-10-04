const generate = require('babel-generator').default;
const jssy = require('../jssy.json')
const { generateJSXElement } = require('../lib')
const { createComponentName } = require('./utils')

class Generator {

  constructor({
    id,
    path,
    title,
    component
  } = {}) {
    this.componentName = createComponentName(id)
    this.rootJSX = generateJSXElement(component)
  }

  generate() {
    return {
      "type": "File",
      "program": {
        "type": "Program",
        "sourceType": "module",
        "body": [
          {
            "type": "ClassDeclaration",
            "id": {
              "type": "Identifier",
              "name": this.componentName
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
                      this.rootJSX
                    ],
                    "directives": []
                  }
                }
              ]
            }
          },
          // ...this.exportsAst
        ]
      }

    }
  }

  logger() {
    console.log(this);
  }

}

const generator = new Generator(jssy.routes[0])

// generator.logger()

const ast = generator.generate()

const { code } = generate(ast)
console.log(code);



// this.importsAst = [{
//   "type": "ImportDeclaration",
//   "specifiers": [
//     {
//       "type": "ImportDefaultSpecifier",
//       "local": {
//         "type": "Identifier",
//         "name": "React"
//       }
//     }
//   ],
//   "importKind": "value",
//   "source": {
//     "type": "StringLiteral",
//     "value": "react"
//   }
// }]
// this.exportsAst = [{
//   "type": "ExportDefaultDeclaration",
//   "declaration": {
//     "type": "Identifier",
//     "name": "App"
//   }
// }]