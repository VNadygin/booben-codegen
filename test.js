import test from 'ava';
const generate = require('babel-generator').default;
import {
  generateJSX,
  generateComponent
} from './lib/index.js'

test('generate jsx with prop={false}', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "static",
        "sourceData": {
          "value": false
        }
      }
    },
    "children": []
  }
  const expected = '<App prop={false}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate jsx with prop={3}', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "static",
        "sourceData": {
          "value": 3
        }
      }
    },
    "children": []
  }
  const expected = '<App prop={3}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate jsx with prop="test string', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "static",
        "sourceData": {
          "value": "test string"
        }
      }
    },
    "children": []
  }
  const expected = '<App prop="test string"></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate jsx with multiple prop1="test string" prop2={3}', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop1": {
        "source": "static",
        "sourceData": {
          "value": "test string"
        }
      },
      "prop2": {
        "source": "static",
        "sourceData": {
          "value": 3
        }
      }
    },
    "children": []
  }
  const expected = '<App prop1="test string" prop2={3}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})


test('generate jsx with array prop', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "static",
        "sourceData": {
          "value": [
            { "source": "static", "sourceData": { "value": 1 } },
            { "source": "static", "sourceData": { "value": 2 } },
            { "source": "static", "sourceData": { "value": 3 } }
          ]
        }
      }
    },
    "children": []
  }

  const expected = '<App prop={[1, 2, 3]}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate jsx with object prop', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "static",
        "sourceData": {
          "value": {
            "property1": { "source": "static", "sourceData": { "value": "foo" } },
          }
        }
      }
    },
    "children": []
  }

  const expected = '<App prop={{\n  property1: "foo"\n}}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  
  t.is(code, expected)
})

test('generate const jsx with prop={false}', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "const",
        "sourceData": {
          "value": false
        }
      }
    },
    "children": []
  }
  const expected = '<App prop={false}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate const jsx with prop="test string"', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "const",
        "sourceData": {
          "value": "test string"
        }
      }
    },
    "children": []
  }
  const expected = '<App prop="test string"></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate const jsx with prop="test string"', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "const",
        "sourceData": {
          "value": {
            "property1": "foo",
            "property2": "bar",
          }
        }
      }
    },
    "children": []
  }
  const expected = '<App prop={{\n  property1: "foo",\n  property2: "bar"\n}}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate const jsx with prop=[array]', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "const",
        "sourceData": {
          "value": [1,2,3],
        }
      }
    },
    "children": []
  }
  const expected = '<App prop={[1, 2, 3]}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate const jsx with nested object', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "const",
        "sourceData": {
          "value": {
            "foo": "bar",
            "nested": {
              "a": 1
            }
          }
        }
      }
    },
    "children": []
  }
  const expected = '<App prop={{\n  foo: "bar",\n  nested: {\n    a: 1\n  }\n}}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate const jsx const and static jssyValue', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop1": {
        "source": "const",
        "sourceData": {
          "value": 5
        }
      },
      "prop2": {
        "source": "static",
        "sourceData": {
          "value": {
            "property1": { "source": "static", "sourceData": { "value": "foo" } },
          }
        }
      }
    },
    "children": []
  }
  const expected = '<App prop1={5} prop2={{\n  property1: "foo"\n}}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate paramRoutes', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "routeParams", 
        "sourceData": {
          "routeId": 1,
          "paramName": "foo"
        }
      }
    },
    "children": []
  }
  const expected = '<App prop={props.match.params.foo}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate const jsx static and routeParams jssyValue', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "static",
        "sourceData": {
          "value": {
            "foo": { "source": "static", "sourceData": { "value": 42 } },
            "bar": { "source": "routeParams", "sourceData": { "routeId": 1, "paramName": "foo" } }
          }
        }
      }
    },
    "children": []
  }
  const expected = '<App prop={{\n  foo: 42,\n  bar: props.match.params.foo\n}}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})


test('generate jsx with App and App 2 prop={false}', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "static",
        "sourceData": {
          "value": false
        }
      }
    },
    "children": [{
      "id": 0,
      "name": "App2",
      "title": "",
      "isWrapper": false,
      "props": {
        "prop": {
          "source": "static",
          "sourceData": {
            "value": false
          }
        }
      },
      "children": [{
        "id": 0,
        "name": "App3",
        "title": "",
        "isWrapper": false,
        "props": {
          "prop": {
            "source": "static",
            "sourceData": {
              "value": false
            }
          }
        },
        "children": []
      }]
    }]
  }
  const expected = '<App prop={false}><App2 prop={false}><App3 prop={false}></App3></App2></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

test('generate jsx with action prop={onPress}', t => {
  const jssy = {
    "id": 0,
    "name": "App",
    "title": "",
    "isWrapper": false,
    "props": {
      "prop": {
        "source": "actions",
        "sourceData": {
          "actions": [
            {
              "type": "url",
              "params": {
                "url": "google.com",
                "newWindow": true
              }
            }
          ]
        }
      }
    },
    "children": []
  }

  const expected = '<App prop={this.handleComponentAction0}></App>;'
  const ast = generateJSX(jssy)
  const { code } = generate(ast)
  t.is(code, expected)
})

