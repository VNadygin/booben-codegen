'use strict';

var fs = require('mz/fs');
var archiver = require('archiver');
var path = require('path');

var archiveProject = function archiveProject(cwd) {
  return new Promise(function (resolve, reject) {
    var output = fs.createWriteStream(path.join(cwd, '/project.zip'));
    var archive = archiver('zip');

    archive.pipe(output);
    archive.directory(cwd, false);
    archive.finalize();

    output.on('close', function () {
      resolve();
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
      reject(err);
    });
  });
};

module.exports = archiveProject;
//# sourceMappingURL=archiveProject.js.map