'use strict';
var block = require('./block')
var tools = require('../tools')

/**
 * usage:
 *
 * - if:
 *    test:
 *      eq:
 *         - $testthis
 *         - 12
 * - then:
 *     - otherblocks
 */

class _if extends block {
    run(settings, state, callback) {

        if (typeof settings.test === 'undefined') {
            callback(new Error("If block must have a 'test' setting"));
            return;
        }

        const testResult = this.testTest(settings.test);


        if (testResult && settings.then) {
            this.runBlockList(settings.then, state, callback);
            return;
        }

        if (!testResult && settings.else) {
            this.runBlockList(settings.else, state, callback);
            return;
        }


        callback(null, settings.default)
    }

    testTest(test) {

        if (test && typeof test === "object") {
            const testThese = Object.keys(test);
            let allOk = true;
            for (const key of testThese) {
                if (!this.testThis(key, test[key])) allOk = false;
            }
            return allOk;
        }
        else
            return test
    }

    testThis (type, params) {
        if (type === "gt") return params[0] > params[1];
        if (type === "lt") return params[0] < params[1];
        if (type === "eq") return params[0] === params[1];
        if (type === "neq") return params[0] !== params[1];
        if (type === "gte") return params[0] >= params[1];
        if (type === "lte") return params[0] <= params[1];
        if (type === "exists") return params[0] ? true : false;
        if (type === "notexists") return params[0] ? false : true;
    }
}


module.exports = _if;