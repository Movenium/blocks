'use strict';
var block = require('./block')
var ReturnError = require('../blocks').ReturnError

class dump extends block {
    run(settings, resolve, reject) {

        if (typeof settings.dump != "undefined")
            reject(new ReturnError(settings.dump, 200));
        else {
            settings._last.then((back) => {
                reject(new ReturnError(back, 200));
            });
        }
    }
}


module.exports = dump;