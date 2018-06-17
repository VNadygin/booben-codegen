'use strict';
require('babel-polyfill');
const generateProject = require('./generateProject');

module.exports = {
  generateProject,
};

// jssy-codegen -f '/Users/vnadygin/develop/braincrumbs/jssy-codegen/project.json' -o /Users/vnadygin/develop/braincrumbs/jssy-codegen/bundle