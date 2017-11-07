const t = require("babel-types")
const _ = require("lodash")
const template = require("babel-template")

const generateLiteral = value => {
  switch (true) {
    case _.isString(value):
      return t.stringLiteral(value)
    case _.isBoolean(value):
      return t.booleanLiteral(value)
    case _.isNumber(value):
      return t.numericLiteral(value)
    case _.isNull(value):
      return t.nullLiteral(value)
    case _.isArray(value):
      return t.arrayExpression(value.map(generateLiteral))
    case _.isObject(value):
      const properties = Object.keys(value).map(key => {
        return t.objectProperty(t.identifier(key), generateLiteral(value[key]))
      })
    return t.objectExpression(properties)
  }
}

const staticJssyValue = ({ sourceData }) => {
  const value = sourceData.value
  switch (true) {
    case _.isArray(value):
      return t.arrayExpression(value.map(jssyValue))
    case _.isObject(value):
      const properties = Object.keys(value).map(key => {
        const astValue = jssyValue(value[key])
        return t.objectProperty(t.identifier(key), astValue)
      })
      return t.objectExpression(properties)
    default:
      return generateLiteral(value)
  }
}

const constJssyValue = ({ sourceData }) => {
  const value = sourceData.value
  return generateLiteral(value)  
}

const routeParamsJssyValue = ({sourceData}) => {
  const paramName = sourceData.paramName
  const templateAst = template(`this.props.match.params.${paramName}`)()
  return templateAst.expression 
}

const actionJssyValue = ({sourceData}, params) => {
  const handlerName = `${params.key}${params.id}`
  const templateAst = template(`this.${handlerName}`)()
  return templateAst.expression 
 }

const stateJssyValue = ({sourceData}) => {
  const { componentId, stateSlot } = sourceData;
  
  const propValue = `_Component${componentId}State_${stateSlot}`
  const templateAst = template(`this.state.${propValue}`)()
  return templateAst.expression
}

// const jssyValue = (jssyValue, params) => {
  
//     if (jssyValue === null) return t.nullLiteral()
//     switch (jssyValue.source) {
//       case 'const':
          //handle const value
//       case 'static': 
            //handle static value
//       case 'routeParams': 
//         return routeParamsJssyValue(jssyValue)
//       case 'action':
//         return actionJssyValue(jssyValue, params)
//       case 'state':
//         return stateJssyValue(jssyValue)
//     }
//   }

const argJssyValue = ({ sourceData }) => {
  const path = sourceData.path.reduce(($0, $1) => $0 + '.' + $1)  //handle [0]
  return template(`
    args[${sourceData.arg}].${path}
  `)()
}

const functionJssyValue = ({sourceData}) => {
  const ARGS = sourceData.args.map(arg => {
    if (arg === null) {
      return t.identifier('undefined')
    }
    return jssyValue(arg)
  })
  console.log('args', ARGS);
  
  const templateAst = template(`
    () => ${sourceData.function}(ARGS)
  `)({ ARGS })
  return templateAst.expression
}

const actionArgJssyValue = ({ sourceData }) => {
  return template(`args[${sourceData.arg}]`).expression
}

const jssyValue = (jssyValue, params) => {
  if (jssyValue === null) return t.nullLiteral()
  switch (jssyValue.source) {
    case 'const':
      return constJssyValue(jssyValue)  
    case 'static': 
      return staticJssyValue(jssyValue)
    case 'routeParams': 
      return routeParamsJssyValue(jssyValue)
    case 'actions':
      return actionJssyValue(jssyValue, params)
    case 'state':
      return stateJssyValue(jssyValue)
    case 'function':
      return functionJssyValue(jssyValue)
    case 'arg':
      return argJssyValue(jssyValue)
    case 'actionArg':
      return actionArgJssyValue(jssyValue)
  }
}

module.exports = {
  jssyValue
}