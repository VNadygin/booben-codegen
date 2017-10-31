const jssy = require('../jssy.json')
const TreeModel = require('tree-model')
const { jssyValue } = require('./jssyValue')
const tree = new TreeModel()
const t = require("babel-types")
const traverse = require('traverse');
const {generateJSXElement} = require('./generateJsx')
const {generateActionAST} = require('./actions')
const { generateState } = require('./state')
const generate = require("babel-generator").default
const template = require("babel-template")


let codeModel = {

}

const routersTree = jssy.routes.map(r => {
  const routeTree = tree.parse(r)
  routeTree.walk(node => {
    const path = node.getPath()
    const fullPath = path.reduce((total, node) => total + node.model.path, '')
    node.model.fullPath = fullPath
    codeModel[node.model.id] = node.model
  })
})



Object.keys(codeModel).map(rKey => {
  const selectRoute = codeModel[rKey]

  selectRoute.component.rootName = `Component${selectRoute.id}`
  selectRoute.handlers = []
  selectRoute.refs = {}
  selectRoute.state = {}
  selectRoute.componentName = `Component${selectRoute.component.id}`
  
    traverse(selectRoute.component).forEach( $0 => {
      if ($0 && $0.props) {
        Object.keys($0.props).map(pKey => {
          traverse($0.props[pKey]).forEach( $2 => {
            if ($2 && $2.source === 'action') {
              const handlerName = `${pKey}${$0.id}`
              selectRoute.handlers = [
                ...selectRoute.handlers,
                {
                  handlerName,
                  actions: $2.sourceData.actions
                }
              ]
            }
            if ($2 && $2.source === 'state') {
              const stateKey = `_Component${$2.sourceData.componentId}State_${$2.sourceData.stateSlot}`
              selectRoute.state[stateKey] = {
                componentId: $2.sourceData.componentId,
                propName: $2.sourceData.stateSlot,
                initialValue: t.nullLiteral()
              }
            }
            
            if ($2 && $2.type === 'method'){
              selectRoute.refs[$2.params.componentId] = `_Component${$2.params.componentId}Ref`
            }
            if ($2 && $2.type === 'prop') {
              const stateKey = `_Component${$2.params.componentId}State_${$2.params.propName}`
              selectRoute.state[stateKey] = $2.params
            }
          })
        })
      }
      
    })
      
    selectRoute.jsxAST = generateJSXElement(selectRoute.component, selectRoute)
    selectRoute.handlersAst = selectRoute.handlers.map(generateActionAST)
    selectRoute.stateAst = Object.keys(selectRoute.state).map(sKey => {
      return generateState(selectRoute.state[sKey])
    })
  
})




// const rootAST = renderRoot()
// console.log(generate(rootAST).code);


// console.log(codeModel[1].state);


console.log(ComponentCode[1])


// console.log(generate(codeModel['0'].jsxAST).code);
console.log(codeModel['0'].handlers);
// console.log(codeModel['0'].stateAst);



