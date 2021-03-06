var gulp = require('gulp');
var gutil = require('gulp-util');
var colors = gutil.colors;
var nodePath = require('path');
var del = require("del");
var vinylPaths = require('vinyl-paths');
var replace = require('gulp-replace');
var print = require('gulp-print');
var inject = require('gulp-inject');

var bundling = require('./bundling.js');
var pathTools = require('./path-tools.js');
var compilation = require('./compilation.js');
var utils = require('./utils.js');

var build = {};

build.compileScss = function (vars, options) {
    utils.ensureVariableSet(vars, "APP_DIR");

    return compilation.compileSass(vars.APP_DIR);
}

build.moduleFixScriptPath = nodePath.resolve('./module-fix.js');

build.compileTypescript = function (vars, options) {
    utils.ensureVariableSet(vars, "APP_PROD");
    utils.ensureVariableSet(vars, "PROD_TSCONFIG");

    return compilation.compileTypescript(vars.PROD_TSCONFIG, vars.APP_PROD);
}

build.processAngularTemplates = function (vars, options) {
    utils.ensureVariableSet(vars, "NGC_TSCONFIG");

    return compilation.compileAngularTemplates(vars.NGC_TSCONFIG);
}

build.makeCommonBundle = function (vars, options) {
    utils.ensureVariableSet(vars, "COMMON_BUNDLE_SCRIPTS");
    utils.ensureVariableSet(vars, "INDEX_HTML");
    utils.ensureVariableSet(vars, "COMMON_BUNDLE_NAME");
    utils.ensureVariableSet(vars, "APP_DIR_NAME");
    utils.ensureVariableSet(vars, "DIST_DIR");

    var scripts = vars.COMMON_BUNDLE_SCRIPTS || [];

    var destDir = nodePath.join(vars.DIST_DIR, vars.APP_DIR_NAME);
    var bundle = bundling.concatBundle(vars.COMMON_BUNDLE_NAME, scripts,
        { destDir: destDir, uglify: true, cache: true, verbose: true });
    return bundle.stream;
};

build.makeAppBundle = function (vars, options) {
    utils.ensureVariableSet(vars, "APP_BUNDLE_NAME");
    utils.ensureVariableSet(vars, "DIST_DIR");
    utils.ensureVariableSet(vars, "APP_DIR_NAME");
    utils.ensureVariableSet(vars, "APP_ROLLUP_ENTRY");

    var destDir = nodePath.join(vars.DIST_DIR, vars.APP_DIR_NAME);
    let mainEntry = nodePath.join(vars.APP_ROLLUP_ENTRY);
    var bundle = bundling.rollupFromEntry(vars.APP_BUNDLE_NAME, mainEntry,
        { format: "iife" },
        { destDir: destDir, uglify: true, cache: false });
    return bundle.stream;
};

build.copyAssetsToDist = function (vars, options) {
    utils.ensureVariableSet(vars, "DIST_DIR");
    utils.ensureVariableSet(vars, "ASSETS_DIR");

    let assetsDest = nodePath.join(vars.DIST_DIR,
        nodePath.relative(nodePath.dirname(vars.INDEX_HTML), vars.ASSETS_DIR));
    return gulp.src(vars.ASSETS_DIR + "/**/*.*")
      .pipe(gulp.dest(assetsDest))
      .on("end", () => gutil.log("Published " + vars.ASSETS_DIR + " --> " + assetsDest));
}


build.processIndexHtml = function(vars, options) {
    utils.ensureVariableSet(vars, "DIST_DIR");
    utils.ensureVariableSet(vars, "INDEX_HTML");
    utils.ensureVariableSet(vars, "INJECT_SCRIPTS_PROD");
    utils.ensureVariableSet(vars, "INDEX_HTML");

    var scripts = vars.INJECT_SCRIPTS_PROD || [];
    var scriptSources = gulp.src(scripts, { read: false });

    return gulp.src(vars.INDEX_HTML)
        .pipe(gulp.dest(vars.DIST_DIR))
        .pipe(replace('<!-- prod --', '<!-- prod -->'))
        .pipe(replace('-- end-prod -->', '<!-- end-prod -->'))
        .pipe(replace('<!-- dev -->', '<!-- dev --'))
        .pipe(replace('<!-- end-dev -->', '-- end-dev -->'))
        .pipe(inject(scriptSources, { relative: true }))
        .pipe(gulp.dest(vars.DIST_DIR))
        .pipe(print(file => { gutil.log('Published --> ' + file) }));
}

build.clean = function (vars, options) {
    gutil.log("Cleaning prod...");
    return gulp.src([
        nodePath.join(vars.APP_DIR, "**" , "*.js"),
        nodePath.join(vars.APP_DIR, "**" , '*.js.map'),
        nodePath.join(vars.APP_DIR, "**", '*.metadata.json'),
        nodePath.join(vars.DIST_DIR, "**", '*.*'),
        '!' + nodePath.join(vars.DIST_DIR, vars.APP_DIR_NAME, vars.COMMON_BUNDLE_NAME),
        vars.AOT_DIR
    ])
    .pipe(vinylPaths(del))
    .on('end', () => gutil.log("Cleaning done."));
};

module.exports = build;
