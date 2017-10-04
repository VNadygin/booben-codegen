const jssy = require('./jssy.json')
const generate = require('babel-generator').default;

const generateAst = route => {
  const state = {}
  const methods = []
  const jsx = {}

  return {
    "type": "File",
    "program": {
      "type": "Program",
      "sourceType": "module",
      "body": {
        "type": "ClassDeclaration",
        "id": {
          "type": "Identifier",
          "name": "Root"
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
                  state,
                  ...methods
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
                  jsx
                ],
                "directives": []
              }
            }
          ]
        }
      },
    }
  }
}



const ast = generateAst(jssy.routes[0])

const { code } = generate(ast)

console.log(code);
