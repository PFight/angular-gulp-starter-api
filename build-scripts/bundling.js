var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglifyjs');
var ts = require('gulp-typescript');
var print = require('gulp-print');
var file = require('gulp-file');
var fileExists = require('file-exists');
var gutil = require('gulp-util');
var colors = gutil.colors;
var rename = require('gulp-rename');
var rollup = require('rollup-stream');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var nodePath = require('path');
var fs = require("fs");
var gulpif = require('gulp-if');
var globIntersection = require("glob-intersection");

var utils = require('./utils.js');

var bundling = {};



/** Performs concatenation of specified packages to single bundle */
bundling.concatBundle = function (name, paths, options) {
    options = options || {};
    return bundleSingleFileHelper(name, options, (outputFileName) => {
        !options.silent && gutil.log(bundleOut(outputFileName, colors.gray("concatenating...")));
        return gulp.src(paths)
            .pipe(gulpif(options.verbose, print(f => bundleIn(name, f))))
            .pipe(concat(outputFileName))
            .pipe(gulpif(options.uglify, uglify()))
            .pipe(gulp.dest(options.destDir))
            .pipe(gulpif(!options.silent, print(f => bundleOut(f, 'concatenation done!'))));
    });
}

/** Uses rollup and tsc to make es5 bundle, that contains all specified packages mapped for use with SystemJS */
bundling.rollupPackages = function (name, packagesMap, rollupOptions, options) {
    options = options || {};
    return bundleSingleFileHelper(name, options, (outputFileName) => {
        var rollupEntry;
        var createRollupEntry = function () {
            var generate = generateRollupEntry(packagesMap, name, options.verbose, options.tempDir);
            rollupEntry = generate.resultFiles[0];
            return generate.stream;
        }
        var makeRollup = function () {
            var config = getRollupConfig(rollupOptions, rollupEntry);
            var rolling = rollupBundle(config, outputFileName,
                options.destDir, options.uglify, !options.silent);
            return rolling.stream;
        }
        return utils.sync(createRollupEntry, makeRollup);
    });
}

/** Uses rollup and tsc to make es5 bundle from single entry file */
bundling.rollupFromEntry = function (name, rollupEntry, rollupOptions, options) {
    rollupOptions = rollupOptions || {};
    options = options || {};
    return bundleSingleFileHelper(name, options, (outputFileName) => {
        var config = getRollupConfig(rollupOptions, rollupEntry);
        var rolling = rollupBundle(config, outputFileName,
            options.destDir, options.uglify, !options.silent);
        return rolling.stream;
    });
}

/* -------------------- Helpers ----------------------------*/

function bundleIn(name, file) {
    return colors.gray("[" + name + "] <-- ") + file;
}

function bundleOut(name, file) {
    return colors.gray("[" + name + "] --> ") + colors.magenta(file);
}

function bundleSingleFileHelper(name, options, bundleFunc) {
    var result = {};
    var outputFileName = name;
    var outputFilePath = nodePath.join(options.destDir || "./", outputFileName);

    result.resultFiles = [outputFilePath];
    if (!fileExists(outputFilePath) || options.cache === false) {
        result.stream = bundleFunc(outputFileName);
    } else {
        !options.silent && gutil.log(bundleOut(name, outputFilePath) + colors.gray(" already exists, skipping..."));
        result.stream = utils.nope();
    }
    return result;
}

/** Generates .ts file, that imports all specified modules */
function generateRollupEntry(packagesMap, name, log, tempDir) {
    var rollupEntryName = nodePath.join(
        (tempDir || "temp"),
        (name + "-rollup-entry.generated.js")
    );
    var pakages = Object.keys(packagesMap);
    var content = "";
    for (var pkgNum = 0; pkgNum < pakages.length; pkgNum++) {
        var packageName = pakages[pkgNum];
        var packagePath = packagesMap[packageName];

        var pkgVar = "pkg" + pkgNum;
        content += (
            "import * as " + pkgVar + " from '" + packagePath + "'; \n" +
            "System && System.set && System.set('" + packageName + "', System.newModule(" + pkgVar + "));\n\n"
        );
        log && gutil.log(bundleIn(nodePath.relative("./", rollupEntryName), packagePath));
    }
    var result = {};
    result.resultFiles = [rollupEntryName];
    result.stream = file(rollupEntryName, content, { src: true })
        .pipe(gulp.dest('./'));
    return result;
};

/** Loads defaults from config file and adds support for GLOB matching in 'external' option */
function getRollupConfig(rollupOptions, rollupEntry, configFile) {
    var resultConfig = require(configFile || require.resolve("./rollup-config.js"));
    resultConfig.entry = rollupEntry;
    resultConfig.format = resultConfig.format || "cjs";
    if (rollupOptions) {
        for (var option in rollupOptions) {
            if (option == "external") {
                // Support for GLOB matching in external option
                resultConfig.external = function (id) {
                    return rollupOptions.external.some(
                        x => globIntersection(x, id)
                    );
                };
            } else if (option == "plugins") {
                // Append plugins to default ones
                resultConfig.plugins = resultConfig.plugins.concat(
                    rollupOptions[option]);
            } else {
                resultConfig[option] = rollupOptions[option];
            }
        }
    }
    return resultConfig;
}

/** Calls rollup and traspiles result to es5 */
function rollupBundle(rollupConfig, outputFileName, destDir, uglifyResult, log) {
    log && gutil.log(bundleOut(rollupConfig.entry, outputFileName + " " + colors.gray("rolling up...")));
    var result = {};
    result.resultFiles = [nodePath.join(destDir || "./", outputFileName)];
    result.stream = rollup(rollupConfig)
        .pipe(source(outputFileName, './'))
        .pipe(buffer())
        .pipe(ts({
            target: "es5",
            allowJs: true,
            module: "commonjs",
            moduleResolution: "node"
        }))
        .pipe(gulpif(uglifyResult, uglify()))
        .pipe(gulp.dest(destDir || "./"))
        .pipe(gulpif(log, print(f => bundleOut(f, "rollup done!"))));
    return result;
}

module.exports = bundling;
