'use strict';
var block = require('./block')

class config extends block {
    run(settings, resolve) {
        resolve(settings)
    }
}


module.exports = config;