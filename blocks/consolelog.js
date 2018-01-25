'use strict';
var block = require('./block')
var ReturnError = require('../blocks').ReturnError
var Promise = require("promise")
var tools = require('../tools')

class consolelog extends block {
    run(settings, resolve, reject) {
        Promise.resolve(typeof settings.log != "undefined" ? settings.log : null || this._last(settings)).then((message) => {
            if (settings.label)
                console.log(settings.label, message)
            else
                console.log(message);

            if (settings.stop)
                reject(message)
            else
                resolve(settings._last)
        })
    }
}


module.exports = consolelog;