var resolve = require('node-resolve');
var fs = require("fs");
var path= require("path");
var gulp = require("gulp");
var es = require("event-stream");
var streamQueue = require("streamqueue");

var rxjs = require("./libs/rxjs/build.js");

gulp.task("rxjs", function () {
    return rxjs.compileToEs6();
});