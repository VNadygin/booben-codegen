const template = require('babel-template');
const { jssyValue } = require('./jssyValue');

const generateAttributeRef = name => ({
  type: 'JSXAttribute',
  name: {
    type: 'JSXIdentifier',
    name: 'ref',
  },
  value: {
    type: 'JSXExpressionContainer',
    expression: {
      type: 'ArrowFunctionExpression',
      id: null,
      generator: false,
      expression: true,
      async: false,
      params: [
        {
          type: 'Identifier',
          name: 'ref',
        },
      ],
      body: {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'MemberExpression',
          object: {
            type: 'ThisExpression',
          },
          property: {
            type: 'Identifier',
            name,
          },
          computed: false,
        },
        right: {
          type: 'Identifier',
          name: 'ref',
        },
      },
    },
  },
});

const generateAttribute = (name, value, component, model) => {
  const stateKey = `_Component${component.id}State_${name}`;

  if (
    model.state &&
    model.state[stateKey] &&
    model.state[stateKey].propName === name
  ) {
    model.state[stateKey].initialValue = value;
    return {
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name,
      },
      value: {
        type: 'JSXExpressionContainer',
        expression: template(`
          this._Component${component.id}State_${name}
        `)().expression,
      },
    };
  }

  if (value.type === 'StringLiteral') {
    return {
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name,
      },
      value,
    };
  } else {
    return {
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name,
      },
      value: {
        type: 'JSXExpressionContainer',
        expression: value,
      },
    };
  }
};

const generateJSXElement = (component, model) => {
  const { id, name, props, children } = component;
  // TODO: get correct name
  // TODO: staticJSValue, add another JSValue

  let attributes = Object.keys(props).map(key => {
    const value = jssyValue(props[key], { id: component.id, key });
    return generateAttribute(key, value, component, model);
  });

  if (model.refs && model.refs[id]) {
    attributes = [...attributes, generateAttributeRef(model.refs[id])];
  }

  return {
    type: 'JSXElement',
    openingElement: {
      type: 'JSXOpeningElement',
      attributes,
      name: {
        type: 'JSXIdentifier',
        name,
      },
      selfClosing: false,
    },
    closingElement: {
      type: 'JSXClosingElement',
      name: {
        type: 'JSXIdentifier',
        name,
      },
    },
    children: children.map(c => generateJSXElement(c, model)),
  };
};

module.exports = {
  generateJSXElement,
};
