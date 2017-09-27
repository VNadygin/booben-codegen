const parse = require('babylon').parse;
const generate = require('babel-generator').default;
const _ = require('lodash');
const fs = require('fs');
const { initFile, generateBrowserRouter, generateSwitch, generateRoute, generateImportDefault, generateImport, generateStatelessComponent, generateExprort } = require('./lib')
const jssy = require('./jssy.json')

const generateRouteAst = ({path, component, haveIndex, indexComponent}) => {
  const route = generateRoute({path, component, isExact: false})
  const indexRoute =  haveIndex && generateRoute({ path, component: indexComponent, isExact: true})
  return [route, indexRoute]
}

const importsAst = [
  generateImportDefault({identifier: "React", source: "react"}),
  generateImport({
    specifiers: ['BrowserRouter', 'Route', 'Switch'],
    source: 'react-router-dom'
  })
]

const routerComponentAst = generateStatelessComponent({
  identifier:'Router',
  body: generateBrowserRouter([generateSwitch(_.flatten(jssy.routes.map(generateRouteAst)))])
})

const exportAst = generateExprort({ identifier: 'Router' })


const body = [
  ...importsAst,
  routerComponentAst,
  exportAst
]
const { code } = generate(initFile(body))

fs.writeFile("Router.js", code)