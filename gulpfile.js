var resolve = require('node-resolve');
var fs = require("fs");
var path= require("path");
var gulp = require("gulp");
var es = require("event-stream");
var streamQueue = require("streamqueue");

var buildRxjs = require("./package-scripts/build-rxjs");

gulp.task("rxjs", function () {
    return streamQueue({ objectMode: true },
        () => buildRxjs.rxjsToEs(),
        () => buildRxjs.rxjsBundle());
});