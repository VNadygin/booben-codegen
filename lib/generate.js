const exec = require('mz/child_process').exec;
const getMetadata = require('./getMetadata');
const buildModel = require('./buildModel');
const generateComponentFile = require('./generateComponentFile');
const generateFunctions = require('./generateFunctions');

const installDependencies = async (dependencies, outputDir) => {
  const libs = dependencies.join(' ');
  await exec('npm init -y', { cwd: outputDir });
  await exec(`npm i --save ${libs}`, { cwd: outputDir });
};

const generate = async (jssyProject, outputDir) => {
  const { componentLibs } = jssyProject;
  await installDependencies(componentLibs, outputDir);

  const meta = await getMetadata(componentLibs, outputDir);
  const model = buildModel(jssyProject, meta);

  const routeData = generateComponentFile(model.files[0], model);
  console.log(routeData);
  const functions = generateFunctions(model.functions);
  console.log(functions);
};

module.exports = generate;
