'use strict';
var block = require('./block')

class data extends block {
    run(settings, state, callback) {
        callback(null, settings.data)
    }
}


module.exports = data;