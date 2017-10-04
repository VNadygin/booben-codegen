const generate = require('babel-generator').default;

const stateAst = {
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
        "name": "state"
      },
      "computed": false
    },
    "right": {
      "type": "ObjectExpression",
      "properties": [
        {
          "type": "ObjectProperty",
          "method": false,
          "shorthand": false,
          "computed": false,
          "key": {
            "type": "Identifier",
            "name": "isOpen"
          },
          "value": {
            "type": "BooleanLiteral",
            "value": false
          }
        }
      ]
    }
  }
}

const methodsAst = [
  {
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
          "name": "handleOnPress"
        },
        "computed": false
      },
      "right": {
        "type": "ArrowFunctionExpression",
        "id": null,
        "generator": false,
        "expression": false,
        "async": false,
        "params": [
          {
            "type": "ObjectPattern",
            "properties": [
              {
                "type": "ObjectProperty",
                "method": false,
                "shorthand": true,
                "computed": false,
                "key": {
                  "type": "Identifier",
                  "name": "url"
                },
                "value": {
                  "type": "Identifier",
                  "name": "url"
                },
                "extra": {
                  "shorthand": true
                }
              },
              {
                "type": "ObjectProperty",
                "method": false,
                "shorthand": true,
                "computed": false,
                "key": {
                  "type": "Identifier",
                  "name": "newWindow"
                },
                "value": {
                  "type": "Identifier",
                  "name": "newWindow"
                },
                "extra": {
                  "shorthand": true
                }
              }
            ]
          }
        ],
        "body": {
          "type": "BlockStatement",
          "body": [
            {
              "type": "ExpressionStatement",
              "expression": {
                "type": "ConditionalExpression",
                "test": {
                  "type": "LogicalExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "window"
                  },
                  "operator": "&&",
                  "right": {
                    "type": "Identifier",
                    "name": "newWindow"
                  }
                },
                "consequent": {
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
                      "type": "TemplateLiteral",
                      "expressions": [],
                      "quasis": [
                        {
                          "type": "TemplateElement",
                          "value": {
                            "raw": "//$url",
                            "cooked": "//$url"
                          },
                          "tail": true
                        }
                      ]
                    }
                  ]
                },
                "alternate": {
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
                    "type": "TemplateLiteral",
                    "expressions": [],
                    "quasis": [
                      {
                        "type": "TemplateElement",
                        "value": {
                          "raw": "//$url",
                          "cooked": "//$url"
                        },
                        "tail": true
                      }
                    ]
                  }
                }
              }
            }
          ],
          "directives": []
        }
      }
    }
  }
]

const jsxAst = {
  "type": "ExpressionStatement",
  "expression": {
    "type": "JSXElement",
    "openingElement": {
      "type": "JSXOpeningElement",
      "attributes": [
        {
          "type": "JSXAttribute",
          "name": {
            "type": "JSXIdentifier",
            "name": "onPress"
          },
          "value": {
            "type": "JSXExpressionContainer",
            "expression": {
              "type": "MemberExpression",
              "object": {
                "type": "ThisExpression",
              },
              "property": {
                "type": "Identifier",
                "name": "handleOnPress"
              },
              "computed": false
            }
          }
        }
      ],
      "name": {
        "type": "JSXMemberExpression",
        "object": {
          "type": "JSXIdentifier",
          "name": "Reactacle"
        },
        "property": {
          "type": "JSXIdentifier",
          "name": "App"
        }
      },
      "selfClosing": false
    },
    "closingElement": {
      "type": "JSXClosingElement",
      "name": {
        "type": "JSXMemberExpression",
        "object": {
          "type": "JSXIdentifier",
          "name": "Reactacle"
        },
        "property": {
          "type": "JSXIdentifier",
          "name": "App"
        }
      }
    },
    "children": [
      {
        "type": "JSXText",
        "extra": null,
        "value": "\n    width="
      },
      {
        "type": "JSXExpressionContainer",
        "expression": {
          "type": "NumericLiteral",
          "extra": {
            "rawValue": 33,
            "raw": "33"
          },
          "value": 33
        }
      },
      {
        "type": "JSXText",
        "extra": null,
        "value": "\n   "
      }
    ]
  }
}

const constructorAst = {
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
      stateAst,
      ...methodsAst
    ]
  }
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
      jsxAst
    ],
    "directives": []
  }
}

const componentAst = {
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
      constructorAst,
      renderAst
    ]
  }
}
const exportAst = [
  {
    "type": "ExportDefaultDeclaration",
    "declaration": {
      "type": "CallExpression",
      "callee": {
        "type": "Identifier",
        "name": "withApollo"
      },
      "arguments": [
        {
          "type": "Identifier",
          "name": "Root"
        }
      ]
    }
  }
]

const ast = {
  "type": "File",
  "program": {
    "type": "Program",
    "sourceType": "module",
    "body": [
      componentAst,
      ...exportAst
    ],
    "directives": []
  }
}

const createFileAst = body => ({
  "type": "File",
  "program": {
    "type": "Program",
    "sourceType": "module",
    body,
    "directives": []
  }
})

const generateFileAst = route => {
   const importAst = []
   const bodyAst = []
   const exportAst = []

   
  
   return createFileAst([
     ...importAst,
     ...bodyAst,
     ...exportAst
   ])
}





const { code } = generate(generator.ast)
console.log(code);
