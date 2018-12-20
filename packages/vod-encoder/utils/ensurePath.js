var mkdirp = require('mkdirp');

function ensurePath(path) {
  return new Promise(function(resolve, reject) {
    mkdirp(path, function(err) {
      if (err) {
        return reject(err);
      }
      resolve(path);
    });
  });
}

module.exports = ensurePath;
