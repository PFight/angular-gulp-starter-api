var gulp = require('gulp');
var del = require('del');
var fs = require("fs");
var path = require('path');
var resolve = require('browser-resolve');
var gutil = require('gulp-util');
var nodePath = require('path');

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

build.prepareImportModules = function (vars, options) {
    utils.ensureVariableSet(vars, "IMPORT_MODULES");
    utils.ensureVariableSet(vars, "LIBS_DIR");
    utils.ensureVariableSet(vars, "IMPORT_MODULES_ENTRY_NAME");

    let modules = vars.IMPORT_MODULES;
    let flatModuleList = [];
    modules.forEach(module => {
        if (typeof (module) == "string") {
            flatModuleList.push(module); 
        } else if (module.modules) {
            module.modules.forEach(x => {
                flatModuleList.push(x);
            })
        }
    });

    let modulesMap = {};
    flatModuleList.forEach(module => {
        modulesMap[module] = module;
    });
    
    var destDir = nodePath.resolve(__dirname + "/..");
    var bundleName = vars.IMPORT_MODULES_ENTRY_NAME;
    var bundle = bundling.rollupPackages(bundleName, modulesMap,
        { format: "cjs", treeshake: true, sourceMap: false },
        {
            destDir: vars.LIBS_DIR, cache: true, uglify: false,
            tempDir: vars.TEMP_DIR
        });
    return bundle.stream;
}

build.prepareIncludeScripts = function (vars, options) {
    utils.ensureVariableSet(vars, "INCLUDE_SCRIPTS");
    utils.ensureVariableSet(vars, "LIBS_DIR");
    utils.ensureVariableSet(vars, "INCLUDE_SCRIPTS_BUNDLE_NAME");

    var bundle = bundling.concatBundle(
        vars.INCLUDE_SCRIPTS_BUNDLE_NAME, vars.INCLUDE_SCRIPTS,
        { destDir: vars.LIBS_DIR, uglify: false, cache: true, verbose: true });
    return bundle.stream;
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
