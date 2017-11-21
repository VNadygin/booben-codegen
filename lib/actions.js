const template = require('babel-template');
const t = require('babel-types');
const generate = require('babel-generator').default;
const { jssyValue } = require('./jssyValue');

const createActionUrl = ({ url, newWindow }) =>
  template(`
    actionUrl(${url}, ${newWindow})
  `)();

const createActionNavigate = ({ routePath, routeParams }) => {
  if (routeParams === {}) {
    return template(`
      this.props.history.push('${routePath}')
    `)();
  } else {
    const routeParamsAst = jssyValue(routeParams.param);
    const { code } = generate(routeParamsAst);
    const path = routePath + '/${' + code + '}';

    return template(`
      this.props.history.push('${path}')
    `)();
  }
};

const createActionMethod = ({ componentId, method, args }) => {
  const argumentsAst = args.map(jssyValue);
  const actionTemplate = template(`
    this._refs[${componentId}].${method}(foo, bar)
  `)();
  actionTemplate.expression.arguments = argumentsAst;

  return actionTemplate;
};

const createActionAjax = params => {
  //TODO: Headers
  const {
    body,
    decodeResponse,
    method,
    mode,
    successActions,
    url,
    errorActions,
  } = params;

  const urlValue = jssyValue(url);
  const bodyValue = jssyValue(body);
  //TODO: ARRAY_BUFFER
  let decodeResponseAST;
  if (decodeResponse === 'text')
    decodeResponseAST = template('return res.text()')();
  else if (decodeResponse === 'json')
    decodeResponseAST = template('return res.json()')();
  else if (decodeResponse === 'blob')
    decodeResponseAST = template('return res.blob()')();

  const actionTemplate = template(`
    fetch(URL, {
      method: ${method},
      credentials: ${mode}, 
      body: BODY,
    })
    .then(res => {
      DECODE
    })
    .then(data => {
      SUCCESS_ACTIONS
    })
    .catch(err => {
      ERROR_ACTIONS
    })

  `);

  return actionTemplate({
    URL: urlValue,
    BODY: bodyValue,
    DECODE: decodeResponseAST,
    SUCCESS_ACTIONS: successActions.map(createAction),
    ERROR_ACTIONS: errorActions.map(createAction),
  });
};

const createPropAction = ({ componentId, propName, value }) => {
  const stateName = `_Component${componentId}State_${propName}`;
  const convertedValue = jssyValue(value);
  const codeFromConvertedValue = generate(convertedValue).code;
  return template(`
    this.setState({${stateName}: ${codeFromConvertedValue}})
  `)();
};

const createMutationAction = ({
  mutation,
  args,
  successActions,
  errorActions,
}) => {
  const variables = Object.keys(args).map(key =>
    t.objectProperty(t.identifier(key), jssyValue(args[key])),
  );
  const mutationActionTemplate = template(`
    this.props.${mutation}Mutation({
      variables: VARIABLES
    })
    .then(data => {
      SUCCESS_ACTIONS
    })
    .catch(err => {
      ERROR_ACTIONS
    })
  `);

  return mutationActionTemplate({
    VARIABLES: t.objectExpression(variables),
    SUCCESS_ACTIONS: successActions.map(createAction),
    ERROR_ACTIONS: errorActions.map(createAction),
  });
};

const createSetStateAction = ({ stateKey, value }) =>
  template(`
    this.setState({${stateKey}: VALUE})
  `)({ VALUE: jssyValue(value) });

const createAction = ({ type, params }) => {
  switch (type) {
    case 'url':
      return createActionUrl(params);
    case 'navigate':
      return createActionNavigate(params);
    case 'method':
      return createActionMethod(params);
    case 'ajax':
      return createActionAjax(params);
    case 'prop':
      return createPropAction(params);
    case 'mutation':
      return createMutationAction(params);
    case 'setState':
      return createSetStateAction(params);
    default:
      throw new Error('Something went wrong');
  }
};

const createHandler = template(`
  this.HANDLE_NAME = (...args) => {
    ACTIONS
  }
`);

const generateActionAST = ({ handlerName, actions }) => {
  return createHandler({
    HANDLE_NAME: t.identifier(handlerName),
    ACTIONS: actions.map(createAction),
  });
};

module.exports = {
  generateActionAST,
};
