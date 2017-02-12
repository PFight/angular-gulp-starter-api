var gulp = require('gulp');
var del = require('del');
var fs = require("fs");
var path = require('path');
var resolve = require('browser-resolve');
var gutil = require('gulp-util');

var bundling = require('./bundling.js');
var pathTools = require('./path-tools.js');
var compilation = require('./compilation.js');
var utils = require('./utils.js');

var build = {};

build.processStyles = function (vars, options) {
    utils.ensureVariableSet(vars, "APP_DIR");

    return compilation.compileSass(vars.APP_DIR);
}

build.processScripts = function (vars, options) {
    utils.ensureVariableSet(vars, "APP_DIR");
    utils.ensureVariableSet(vars, "TSCONFIG");

    return compilation.compileTypescript(vars.TSCONFIG, vars.APP_DIR);
}

build.clean = function (vars, options) {
    gutil.log("Cleaning dev...");
    return gulp.src([
        nodePath.join(vars.APP_DIR, "**", '*.js'),
        nodePath.join(vars.APP_DIR, "**" , '*.js.map')
    ])
    .pipe(vinylPaths(del))
    .on('end', () => gutil.log("Cleaning done."));
};


module.exports = build;
