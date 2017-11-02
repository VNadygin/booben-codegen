//jssy-codegen -f /Users/vnadygin/develop/braincrumbs/jssy-codegen/jssy.json -o /Users/vnadygin/develop/braincrumbs/jssy-codegen/jssy.json
const exec = require('mz/child_process').exec;
const getMetadata = require('./metadata');
const getModel = require('./model');
const { generateRoute } = require('./route');


const installDependancy = async (dependencies, outputDir) => {
  const libs = dependencies.join(' ');
  await exec(`npm init -y`, { cwd: outputDir})
  await exec(`npm i --save ${libs}`, { cwd: outputDir})
};

const generate = async (jssyProject, outputDir) => {
  const { componentLibs } = jssyProject;
  // await installDependancy(componentLibs, outputDir);
  const meta = await getMetadata(componentLibs, outputDir);
  const model = getModel(jssyProject, meta); 
  // console.log(model);
  
  // const routeData = generateRoute(model.route[1])
  // console.log(routeData);
  
  
  
   
};

module.exports = generate;

//visit action, visitvalue