const template = require('babel-template');
const generate = require('babel-generator').default;

const generateState = ({ componentId, propName, defaultValue }) => {
  const value = generate(defaultValue).code;

  return template(`
    this.state._Component${componentId}State_${propName} = () => ${value};
  `)();
};

module.exports = {
  generateState,
};
