const jssy = require('../jssy.json')

const traverse = require('traverse');
const TreeModel = require('tree-model')
const tree = new TreeModel()

const model = {
  routes: {
    components: {},
  }, 
}
// jssy => jssyProject
// also accept output dir

const generateCode = async jssy => {
  //install all dependency
  //get metadata
  //routes tree normalization
  jssy.routes.forEach(r => {
    const routeTree = tree.parse(r)
    routeTree.walk(node => {
      const path = node.getPath()
      const fullPath = path.reduce((total, node) => total + node.model.path, '')
      node.model.fullPath = fullPath
      model.routes[node.model.id] = node.model
    })
    //component tree normalization
    const componentTree = tree.parse(r.component)
    componentTree.walk(node => {
      model.components[node.model.id] = node.model
    })
  })
  
  Object.keys(model.routes).map(rKey => {
    const selectRoute = model.routes[rKey]
    selectRoute.fileName = `Component${rKey}`
    
  })
}

// function name(node, acummulator ={}, currentFullPath) {
//   const fullPath = concatPath(currentFullPath, node.path), /* ... */ }
//   acummulator[node.id] = { children: [node.children.map(n => n.id)], fuulPath: fullPath}
//   node.children.forEach(c => name(c, acculator, fullPath))
// }

const a = generateCode(jssy)
console.log(model);
