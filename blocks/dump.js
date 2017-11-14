'use strict';
var block = require('./block')
var ReturnError = require('blocks').ReturnError

class dump extends block {
    run(settings, state, callback) {
        callback(new ReturnError(settings.dump || state.default, 200));
    }
}


module.exports = dump;