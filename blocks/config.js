'use strict';
var block = require('./block')

class config extends block {
    run(settings, state, callback) {
        callback(null, settings)
    }
}


module.exports = config;