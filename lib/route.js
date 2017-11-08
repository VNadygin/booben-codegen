const generate = require('babel-generator').default;
const template = require('babel-template');
const t = require('babel-types');
const { generateActionAST } = require('./actions');
const { generateState } = require('./state');
const { generateJSXElement } = require('./generateJsx');

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
    sourceType: 'module',
    plugins: [
      'jsx',
      'flow',
    ],
  }
);

const renderComponentAST = ({ jsxAST, handlersAst, stateAst, componentName }) =>
  componentTemplate({
    COMPONENT_NAME: t.identifier(componentName),
    JSX: jsxAST,
    HANDLERS: handlersAst,
    STATE: stateAst,
  });

const generateRoute = model => {
  const handlersAst = model.handlers.map(generateActionAST);
  const componentName = model.componentName;
  const stateAst = Object.keys(model.state)
    .map(stateKey => generateState(model.state[stateKey]));
  const jsxAST = generateJSXElement(model.unnomalizeComponent, model);
  const componentAst = renderComponentAST({
    handlersAst,
    componentName,
    stateAst,
    jsxAST,
  });
  return generate(componentAst).code;
};

module.exports = {
  generateRoute,
};
