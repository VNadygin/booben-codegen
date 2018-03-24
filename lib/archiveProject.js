const fs = require('mz/fs');
const archiver = require('archiver');
const path = require('path');

const archiveProject = cwd => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(cwd, '/project.zip'));
    const archive = archiver('zip');

    archive.pipe(output);
    archive.directory(cwd, false);
    archive.finalize();

    output.on('close', function() {
      resolve();
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      reject(err)
    });
  });
};

module.exports = archiveProject;
