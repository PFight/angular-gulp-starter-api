var gulp = require('gulp');
var ts = require('gulp-typescript');
var print = require('gulp-print');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var colors = gutil.colors;
var sourcemaps = require('gulp-sourcemaps');
var gulpif = require('gulp-if');
var run = require('gulp-run');
var ngc = require('gulp-ngc');

var compilation = {};

compilation.compileTypescript = function (tsconfigFile, destDir, options) {
    options = options || {};
    !options.silent && gutil.log("Compiling typescript " + colors.magenta(tsconfigFile));
    var tsProject = ts.createProject(tsconfigFile);
    return (options.src ? gulp.src(options.src) : tsProject.src())
        .pipe(gulpif(options.verbose, print(file => {
            gutil.log(colors.gray("[tsc]") + " <-- " + file);
        })))
        .pipe(tsProject())
        .js
        .pipe(gulp.dest(destDir))
        .pipe(gulpif(options.verbose, print(file => {
            gutil.log(colors.gray("[tsc]") + " --> " + file);
        })))
        .on('end', () => !options.silent &&
            gutil.log(gutil.colors.gray('[' + tsconfigFile + '] --> ') +
            "compilation of typescript done (dest dir "
            + gutil.colors.magenta(destDir) + ')'));
}

compilation.compileSass = function (sourceDir, targetDir, options) {
    options = options || {};
    !options.silent && gutil.log("Compiling SCSS in " + colors.magenta(sourceDir));
    return gulp.src(sourceDir + '/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(targetDir || sourceDir))
        .pipe(gulpif(options.verbose,print()))
        .on('end', () => !options.silent && gutil.log("Compilation of SCSS done."));
}

compilation.compileAngularTemplates = function (configFilePath, options) {
    options = options || {};
    !options.silent && gutil.log("Compiling templates with " + gutil.colors.magenta(configFilePath));
    return ngc(configFilePath)
        .on('end', () => !options.silent && gutil.log(
            gutil.colors.gray('[' + configFilePath + '] --> ') +
            "compilation of templates done."));
}


module.exports = compilation;
