const { generateJSXElement, initFile } = require('./lib')
const generate = require('babel-generator').default;
const _ = require('lodash')


const jsx = ({ identifier })  => (children = []) => ([{
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
}])

const ast = jsx({identifier: 'App'})()

const ast2 = jsx({identifier: 'Text'})(ast)

const routes = [
  {
    id: 1,
    path: '/',
    component: 'Root1',
    haveIndex: true,
    indexComponent: 'IndexRoot1'
  },
  {
    id: 2,
    path: '/contact',
    component: 'Contact2',
    haveIndex: false,
    indexComponent: null
  }
]

const ast3 = _.flowRight(
  jsx({identifier: 'BrowserRouter'}),
  jsx({identifier: 'Switch'}),
  ...[routes.map(route => {
    return jsx({identifier: 'Route'})
  })]
)()

const result = generate(initFile(ast3))

console.log(result.code);
