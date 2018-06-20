#!/usr/bin/env node
const minimist = require('minimist');
const fs = require('mz/fs');
const { generateProject } = require('../lib/api');

const cli = async () => {
  const argv = minimist(process.argv.slice(2));
  const result = await fs.readFile(argv.f);
  const meta = await fs.readFile(argv.m);
  const boobenProject = JSON.parse(result);
  await generateProject(boobenProject, argv.o, meta, { logger: console });
};

cli().catch(err => {
  console.error(err.stack);
});
