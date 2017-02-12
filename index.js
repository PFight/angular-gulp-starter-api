

var api = {};

api.bundling = require('./build-scripts/bundling.js');
api.pathTools = require('./build-scripts/path-tools.js');
api.compilation = require('./build-scripts/compilation.js');
api.dev = require('./build-scripts/build.dev.js');
api.prod = require('./build-scripts/build.prod.js');
api.utils = require('./build-scripts/utils.js');

api.sync = api.utils.sync;
api.async = api.utils.async;
api.nope = api.utils.nope;

api.prodServer = require('./servers/express-http-server.prod.js');
api.devServer = require('./servers/express-http-server.dev.js');

api.libs = {};
api.libs.rxjs = require('./libs/rxjs/build.js');

module.exports = api;