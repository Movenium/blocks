'use strict';
var block = require('./block')

class data extends block {
    run(settings, resolve) {

        if (settings.wait) {
            setTimeout(() => {resolve(settings.data)}, settings.wait)
        }
        else
            resolve(settings.data)
    }
}


module.exports = data;