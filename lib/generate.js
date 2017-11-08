const exec = require('mz/child_process').exec;
const getMetadata = require('./metadata');
const getModel = require('./model');
const { generateRoute } = require('./route');
const generateFunctions = require('./generateFunctions');


const installDependancy = async (dependencies, outputDir) => {
  const libs = dependencies.join(' ');
  await exec('npm init -y', { cwd: outputDir });
  await exec(`npm i --save ${libs}`, { cwd: outputDir });
};

const generate = async (jssyProject, outputDir) => {
  const { componentLibs } = jssyProject;
  // await installDependancy(componentLibs, outputDir);
  const meta = await getMetadata(componentLibs, outputDir);
  const model = getModel(jssyProject, meta);
  // console.log('model', model.route[0]);
  
  const routeData = generateRoute(model.route[0]);
  // console.log(routeData);
  const functions = generateFunctions(model.functions);
  // console.log(functions);
};

module.exports = generate;
