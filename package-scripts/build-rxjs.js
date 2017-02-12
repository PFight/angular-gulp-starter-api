var es = require('event-stream');
var streamQueue = require('streamqueue');
var gutil = require('gulp-util');
var fs = require("fs");
var resolve = require('browser-resolve');
var nodePath = require('path');
var del = require('del');

var compilation = require('../build-scripts/compilation.js');
const rxjsEsDir = nodePath.resolve(__dirname +  "/../rxjs-es6");
var pathTools = require('../build-scripts/path-tools.js');
var bundling = require('../build-scripts/bundling.js');

var build = {};

build.rxjsToEs = function () {
    let rxjsMainFilePath = require.resolve("rxjs/Rx");
    let rxjsDir = nodePath.dirname(rxjsMainFilePath);
    let rxjsSrcDir = nodePath.join(rxjsDir, "src");
    let config = require.resolve("./tsconfig.rxjs-to-es6.json");

    return streamQueue({ objectMode: true },
        () => compilation.compileTypescript(config, rxjsEsDir)
    );
}

build.rxjsBundle = function () {
    // Make list of all rxjs modules
    var packagesMap = {};
    var resolvedRxjsEsDir = nodePath.resolve(rxjsEsDir);
    pathTools.walkFilesSync(rxjsEsDir, filePath => {
        // Skip MicsJSDoc due to errors
        if (filePath.indexOf('Rx.js') < 0 && filePath.indexOf('MiscJSDoc.js') < 0) {
            // Get package name, removing folder path, extension and replacing \ to /
            let packageName = pathTools.normalizePathSeparators(
                nodePath.resolve(filePath)
                .replace(resolvedRxjsEsDir, 'rxjs')
                .replace('.js', '')
            );
            packagesMap[packageName] = packageName;
        }
    });

    // Bundle it to the one file
    var destDir = nodePath.resolve(__dirname + "/..");
    var bundleName = "rxjs.js";
    var tempDir = nodePath.resolve(__dirname + "../temp");
    var bundle = bundling.rollupPackages(bundleName, packagesMap, { format: "cjs" },
        { destDir: destDir, cache: false, uglify: false, tempDir: tempDir });
    return bundle.stream;
}

module.exports = build;
