#!/usr/bin/env node
const minimist = require('minimist');
const path = require('path');
const fs = require('mz/fs');
const generate = require('../lib/generate');

const cli = async () => {
  const argv = minimist(process.argv.slice(2));
  const libraryPath = path.resolve(process.cwd());

  if (!await fs.exists(libraryPath)) {
    throw new Error(`${libraryPath} does not exist`);
  }

  const stats = await fs.stat(libraryPath);

  if (!stats.isDirectory()) {
    throw new Error(`${libraryPath} is not a directory`);
  }

  const result = await fs.readFile(argv.f);
  const jssyProject = JSON.parse(result);
  await generate(jssyProject, argv.o);
};

cli().catch(err => {
  console.error(err);
});
