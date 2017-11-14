'use strict';
var block = require('./block')
var ReturnError = require('blocks').ReturnError

class consolelog extends block {
    run(settings, state, callback) {
        console.log(settings.log || state.default);

        if (settings.stop)
            callback(new ReturnError(settings.log || state.default, 200));
        else
            callback(null, state.default)
    }
}


module.exports = consolelog;