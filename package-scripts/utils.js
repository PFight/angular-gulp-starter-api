var streamqueue = require('streamqueue')
var es = require('event-stream');

var utils = {};

utils.ensureVariableSet = function(vars, propName) {
    if (vars && !vars[propName]) {
        console.error("Variable " + propName + " does not set in variables file.");
    }
}

utils.sync = function() {
    let queue = [{ objectMode: true }].concat(arguments);
    return streamqueue(queue);
}

utils.async = function () {
    let actions = [];
    for (let act in arguments) {
        actions.push(arguments[act]());
    }
    return es.merge(actions);
}

utils.nope = function () {
    return es.merge();
}

module.exports = utils;