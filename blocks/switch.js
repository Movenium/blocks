'use strict';
var block = require('./block')

/**
 * usage:
 *
 * - switch:
 *      test: something
 *      something: this was something
 *      somethingelse:
 *          - dump
 *      default: not regocnized
 */

class _switch extends block {
    run(settings, state, callback) {

        if (typeof settings.test === 'undefined') {
            callback(new Error("Switch block must have a 'test' setting"));
            return;
        }

        const search = settings.test;

        if (typeof settings[search] === 'undefined') {
            this.runcase(settings.default, state, callback);
        }
        else {
            this.runcase(settings[search], state, callback);
        }
    }

    runcase(object, state,  callback) {
        if (typeof object === "object") {
            this.runBlockList(object, state, callback);
        }
        else {
            callback(null, object)
        }
    }
}


module.exports = _switch;