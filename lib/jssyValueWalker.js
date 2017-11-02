const _ = require("lodash")
const jssy = require('../jssy.json')
const { jssyValue } = require('./jssyValue')

const walkStaticValue = (jssyProjectValue, model, rKey, cKey, pKey) => {
  const value = jssyProjectValue.sourceData.value
  
  switch (true) {
    case _.isArray(value):
      value.map(walkValueWalker, model, rKey, cKey, pKey)
    case _.isObject(value):
      Object.keys(value).map(key => {
        walkValueWalker(value[key], model, rKey, cKey, pKey)
      })
  }
}

const waltStateValue = (jssyProjectValue, model, rKey, cKey, pKey) => {
  const node = jssyProjectValue
  const selectRoute = model.route[rKey]
  
  const componentNamespace = selectRoute.component[node.sourceData.componentId].name.replace(/(?=\.).*/, '')
  const componentName = selectRoute.component[node.sourceData.componentId].name.replace(/.*(?=\.)./, '')
  const selectMeta = model.meta[componentNamespace].components[componentName]
  const defaultValue = jssyValue(selectMeta.state[node.sourceData.stateSlot].initialValue)

  const stateKey = `_Component${node.sourceData.componentId}State_${node.sourceData.stateSlot}`

  model.route[rKey].state[stateKey] = {
    componentId: node.sourceData.componentId,
    propName: node.sourceData.stateSlot,
    defaultValue
  }
  Object.keys(selectMeta.props).forEach(mKey => {
    if (
      selectMeta.props[mKey].sourceConfigs &&
      selectMeta.props[mKey].sourceConfigs.actions &&
      selectMeta.props[mKey].sourceConfigs.actions.updateState &&
      selectMeta.props[mKey].sourceConfigs.actions.updateState[node.sourceData.stateSlot]
    ) {
      const handlerName = `${mKey}${cKey}`
      model.route[rKey].handlers.push({
        handlerName,
        actions: [{
          type: 'setState',
          params: {
            stateKey,
            value: selectMeta.props[mKey].sourceConfigs.actions.updateState[node.sourceData.stateSlot]
          }
        }]
      })
    }
  })
}

const walkActionType = (action, model, rKey, cKey, pKey) => {
  if (action.type === 'method') {
    model.route[rKey].refs[action.params.componentId] = `_Component${action.params.componentId}Ref`
    action.params.args.forEach(arg => {
      walkValueWalker(arg, model, rKey, cKey, pKey)
    })
  }
  if (action.type === 'prop') {
    const stateKey = `_Component${action.params.componentId}State_${action.params.propName}`
    model.route[rKey].state[stateKey] = {
      ...action.params,
      defaultValue: jssyValue(selectRoute.component[action.params.componentId].props[action.params.propName])
    }
    walkValueWalker(action.params.value, model, rKey, cKey, pKey)
  }
  if (action.type === 'navigate') {
    walkValueWalker(action.params.routeParams.param)
  }
  if (action.type === 'mutation') {
    Object.keys(action.params.args).map(key => {
      
      walkValueWalker(action.params.args[key], model, rKey, cKey, pKey)
    })
      action.params.successActions.forEach(successAction => {
        walkActionType(successAction, model, rKey, cKey, pKey)
      })
      action.params.errorActions.forEach(errorAction => {
        walkActionType(errorAction, model, rKey, cKey, pKey)
      })
    
  }
  if (action.type === 'ajax') {
      walkActionValue(action.param.url)
      walkActionValue(action.param.body)
      action.params.successActions.forEach(successAction => {
        walkActionType(successAction, model, rKey, cKey, pKey)
      })
      action.params.errorActions.forEach(errorAction => {
        walkActionType(errorAction, model, rKey, cKey, pKey)
      })
  }
}

const walkActionValue = (jssyProjectValue, model, rKey, cKey, pKey) => {
  const handlerName = `${pKey}${cKey}`
  model.route[rKey].handlers.push({
    handlerName,
    actions: jssyProjectValue.sourceData.actions
  })
  jssyProjectValue.sourceData.actions.forEach(action => {
    walkActionType(action, model, rKey, cKey, pKey)
  })
}


const walkValueWalker = (jssyProjectValue, model, rKey, cKey, pKey) => {  
  
  switch (jssyProjectValue.source) {
    case 'static':
      walkStaticValue(jssyProjectValue, model, rKey, cKey, pKey)
    case 'const':
      return
    case 'data':
      return
    case 'actions':
      walkActionValue(jssyProjectValue, model, rKey, cKey, pKey)
    case 'routeParams':
      return
    case 'state':
      waltStateValue(jssyProjectValue, model, rKey, cKey, pKey)
    case 'function':
      return
    case 'designer':
      return
    case 'ownerProp':
      return
    case 'actionArg':
      return
  }
}

module.exports = walkValueWalker