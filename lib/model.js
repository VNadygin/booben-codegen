const jssy = require('../jssy.json')
const _ = require('lodash')
const traverse = require('traverse');
const { jssyValue } = require('./jssyValue')

const concatPath = (prefix, path) => {
  if (prefix === '') return path;
  if (prefix === '/') return `/${path}`;
  return `${prefix}/${path}`;
};

const normalizeRoute = (node, accumulator ={}, currentFullPath = '') => {
  const fullPath = concatPath(currentFullPath, node.path)
  accumulator[node.id] = {...node, children: node.children.map(n => n.id), fullPath }
  node.children.forEach(c => normalizeRoute(c, accumulator, fullPath))
  return accumulator
}

const normalizedComponent = (node, accumulator ={}) => {
  accumulator[node.id] = {...node, children: node.children.map(n => n.id) }
  node.children.forEach(c => normalizedComponent(c, accumulator))
  return accumulator
}

const getModel = (jssyProject, meta) => {
  let routes = {}
  let model = {
    meta,
    route: {}
  }
  jssyProject.routes.forEach(r => {
    const normalizedRoute = normalizeRoute(r)
    routes = {
      ...routes,
      ...normalizeRoute(r)
    }
  })
  Object.keys(routes).forEach(key => {
    routes[key].unnomalizeComponent = routes[key].component
    routes[key].component = normalizedComponent(routes[key].component)
  })

  Object.keys(routes).forEach(rKey => {
    const selectRoute = routes[rKey]
    model.route[rKey] = {}
    model.route[rKey].componentName = `Component${rKey}`
    model.route[rKey].component = selectRoute.unnomalizeComponent
    model.route[rKey].handlers = []
    model.route[rKey].refs = {}
    model.route[rKey].state = {}
    Object.keys(selectRoute.component).forEach(cKey => {
      const selectComponent = selectRoute.component[cKey]
      const props = selectComponent.props
      Object.keys(props).forEach(pKey => {
        const selectProp = props[pKey]
        
        traverse(selectProp).forEach(node => {

          if (node && node.source === 'action') {
            const handlerName = `${pKey}${cKey}`
            model.route[rKey].handlers.push({
              handlerName,
              actions: node.sourceData.actions
            })
          }
          if (node && node.type === 'method') {
            model.route[rKey].refs[node.params.componentId] = `_Component${node.params.componentId}Ref`
          }
          if (node && node.type === 'prop') {
            const stateKey = `_Component${node.params.componentId}State_${node.params.propName}`
            model.route[rKey].state[stateKey] = {
              ...node.params,
              defaultValue: jssyValue(selectRoute.component[node.params.componentId].props[node.params.propName])
            }
          }
          if (node && node.source === 'state') {
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
                selectMeta.props[mKey].sourceConfigs
                && selectMeta.props[mKey].sourceConfigs.actions
                && selectMeta.props[mKey].sourceConfigs.actions.updateState
                && selectMeta.props[mKey].sourceConfigs.actions.updateState[node.sourceData.stateSlot]
              ) {
                const handlerName = `${mKey}${cKey}`
                model.route[rKey].handlers.push({
                  handlerName,
                  actions:[{
                    type: 'setState',
                    params: {
                      stateKey,
                      value : selectMeta.props[mKey].sourceConfigs.actions.updateState[node.sourceData.stateSlot]
                    }
                  }]
                })
              }
            })
          }
        })
      })
    })
  })
  return model
  
}

// getModel(jssy)
module.exports = getModel;