'use strict';
var assert = require('assert');
var block = require('./block')
var ReturnError = require('../blocks').ReturnError

class test extends block {
    run(settings, state, callback) {

        try {
            for (const key in settings) {

                if (key === "message") continue;

                const value = settings[key];

                if (value === "(empty)") this.assertEmpty(state[key])
                else assert.deepEqual(state[key], value);

            }
        }
        catch (e) {
            if (this.testMode())
                throw e;
            else
                callback(settings.message ? new ReturnError(settings.message) : e)

            return;
        }

        callback(null, state.default)
    }

    assertEmpty(value) {
        if (typeof value === "object") assert.equal(value.length, 0, "notEmpty")
        else assert.equal(value, "", "notEmpty")
    }
}

module.exports = test;