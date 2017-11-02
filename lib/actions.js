const template = require("babel-template")
const t = require("babel-types")
const { jssyValue } = require('./jssyValue')
const generate = require("babel-generator").default

const createActionUrl = ({ url, newWindow }) => {
  return template(`
    actionUrl(${url}, ${newWindow})
  `)()
}

//TODO: Calc routePath
const createActionNavigate = ({routePath, routeParams}) => {
  if (routeParams === {}) {
    return template(`
      this.props.history.push('${routePath}')
    `)()  
  } else {
    const routeParamsAst = jssyValue(routeParams.param)
    const { code } = generate(routeParamsAst)
    const path = routePath + '/${' + code + '}'

    return template(`
      this.props.history.push('${path}')
    `)()
  }
  
}

const createActionMethod = ({componentId, method, args}) => {
  
  const argumentsAst = args.map(jssyValue)  
  const actionTemplate = template(`
    this._refs[${componentId}].${method}(foo, bar)
  `)()

  actionTemplate.expression.arguments = argumentsAst

  return actionTemplate
   
}

const createActionAjax = params => {
  //TODO: Headers

  const { body, decodeResponse, headers, method, mode, successActions, url, errorActions } = params
  const urlValue = jssyValue(url)
  const bodyValue = jssyValue(body)
  //TODO ARRAY BUFFER
  let decodeResponseAST;
  if (decodeResponse === 'text') {
    decodeResponseAST = template(`return res.text()`)()
  } else if (decodeResponse === 'json') {
    decodeResponseAST = template(`return res.json()`)()
  } else if (decodeResponse === 'blob') {
    decodeResponseAST = template(`return res.blob()`)()
  }
  

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

  `)
  const ast = actionTemplate({
    URL: urlValue,
    BODY: t.nullLiteral(),
    DECODE: decodeResponseAST,
    SUCCESS_ACTIONS: successActions.map(createAction),
    ERROR_ACTIONS: errorActions.map(createAction)
  })
  return ast
}

const createPropAction = ({ componentId, propName, value }) => {
  
  const stateName = `_Component${componentId}State_${propName}`
  const convertedValue = jssyValue(value)
  const codeFromConvertedValue = generate(convertedValue).code
  return template(`
    this.setState({${stateName}: ${codeFromConvertedValue}})
  `)()
}

const createMutationAction = ({mutation, args, successActions, errorActions}) => {
  const variables =  Object.keys(args).map(key => {
    return t.objectProperty(t.identifier(key), jssyValue(args[key]))
  })
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
  `)
  const ast = mutationActionTemplate({
    VARIABLES: t.objectExpression(variables),
    SUCCESS_ACTIONS: successActions.map(createAction),
    ERROR_ACTIONS: errorActions.map(createAction)
  })
  return ast
}

const createSetStateAction = ({stateKey, value}) => {
  return template(`
    this.setState({${stateKey}: VALUE})
  `)({VALUE: jssyValue(value)})
}

const createAction = ({type, params}) => {
  switch (type) {
    case "url":
      return createActionUrl(params)
    case "navigate": 
      return createActionNavigate(params)
    case "method":
      return createActionMethod(params)
    case 'ajax': 
      return createActionAjax(params)
    case 'prop': 
      return createPropAction(params)
    case 'mutation':
      return createMutationAction(params)
    case 'setState':
      return createSetStateAction(params)
  }
}

const createHandler = template(`
  this.HANDLE_NAME = (...args) => {
    ACTIONS
  }
`)

const generateActionAST = ({handlerName, actions}) => {
  
  const handler = createHandler({
    HANDLE_NAME: t.identifier(handlerName),
    ACTIONS: actions.map(createAction),
  });
  return handler
}

const jssy = {
  "handlerName": 'asb',
  "actions": [
    // {
    //   "type": "ajax",
    //   "params": {
    //     "body": null,
    //     "decodeResponse": "text",
    //     "errorActions": [],
    //     "headers": {},
    //     "method": "GET",
    //     "mode": "cors",
    //     "successActions": [{
    //       "type": "prop",
    //       "params": {
    //         "componentId": 0,
    //         "propName": "const",
    //         "systemPropName": "",
    //         "value": {
    //           "source": "const",
    //           "sourceData": {
    //             "value": 3
    //           }
    //         }
    //       }
    //     }],
    //     "url": {
    //       "source": "static",
    //       "sourceData": {
    //         "value": "google.com"
    //       }
    //     }
    //   }
    // }
    {
      "type": "mutation",
      "params": {
        "mutation": "signinUser",
        "args": {
          "email": {
            "source": "static",
            "sourceData": {
              "value": {
                "email": {
                  "source": "state",
                  "sourceData": {
                    "componentId": 46,
                    "stateSlot": "value"
                  }
                },
                "password": {
                  "source": "state",
                  "sourceData": {
                    "componentId": 49,
                    "stateSlot": "value"
                  }
                }
              }
            }
          }
        },
        "successActions": [],
        "errorActions": []
      }
    }
    
  ]
}

// const ast = generateActionAST(jssy)
// const { code } = generate(ast)
// console.log(code);

module.exports = {
  generateActionAST
}
