import test from 'ava';
const generate = require('babel-generator').default;
import {
  generateJSX
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

