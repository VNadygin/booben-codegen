const generate = require("babel-generator").default
const template = require("babel-template")
const t = require("babel-types")
const { generateActionAST } = require('./actions')
const { generateState } = require('./state');
const { generateJSXElement } = require('./generateJsx')

const componentTemplate = template(`
 class COMPONENT_NAME extends React.Component{
   constructor() {
     super()
     STATE
     HANDLERS
   }
   
   render() {
     return JSX
   }
 }
 `, {
 // parse in strict mode and allow module declarations
 sourceType: "module",

 plugins: [
   // enable jsx and flow syntax
   "jsx",
   "flow"
 ]
});

const renderComponentAST = ({jsxAST, handlersAst, stateAst, componentName}) => {
  return componentTemplate({
    COMPONENT_NAME: t.identifier(componentName),
    JSX: jsxAST,
    HANDLERS: handlersAst,
    STATE: stateAst
  });
 }

const generateRoute = model => {
  const handlersAst = model.handlers.map(generateActionAST)
  const componentName = model.componentName
  const stateAst = Object.keys(model.state).map(stateKey => {
    return generateState(model.state[stateKey])
  })
  const jsxAST = generateJSXElement(model.component, model)
  const componentAst = renderComponentAST({
    handlersAst,
    componentName,
    stateAst,
    jsxAST
  })
  return generate(componentAst).code
}




// const ComponentCode = Object.keys(codeModel).map(key => {
//  const ast = renderComponentAST(codeModel[key])
//  return generate(ast).code
// })

// const renderRoute = ({path, id}) => {
 
//  return template(`
//    <Route path='${path}' component={Component${id}}/>
//  `, {
//    // parse in strict mode and allow module declarations
//    sourceType: "module",
 
//    plugins: [
//      // enable jsx and flow syntax
//      "jsx",
//      "flow"
//    ]
//    })()
// }

// const renderRoot = () => {
//  const importsTemplate = template(`
//    import React, {Component} from 'react';
//    import { BrowserRouter, Route, Switch } from 'react-router-dom';
//  `, {
//    sourceType: "module",
//    plugins: [
//      "jsx",
//      "flow"
//    ]
//  })()
//  let rootTemplate = template(`
//      const Root = () => (
//        <BrowserRouter>
//          <Switch>
//          {JSX}
//          </Switch>
//        </BrowserRouter>
//      )
//  `, {
//    sourceType: "module",
//    plugins: [
//      "jsx",
//      "flow"
//    ]
//  })({
//    JSX: jssy.routes.map(renderRoute)  
//  })
 
//  const exportsTemplate = template(`
//    export default Root
//  `, {
//    sourceType: "module",
//    plugins: [
//      "jsx",
//      "flow"
//    ]
//  })()


 
//  const file = {
//    "type": "File",
//    "program": {
//      "type": "Program",
//      "sourceType": "module",
//      "body": [
//        ...importsTemplate,
//        rootTemplate,
//        exportsTemplate
//      ]
//    }
//  }

//  return file
// }

module.exports = {
  generateRoute
}