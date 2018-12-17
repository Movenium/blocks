'use strict';
var block = require('./block');
const assert = require('assert');

class _block extends block {
    run() {
        const test = this.get("test", null)
        const message = this.get("message", null)

        const action = this.firstExisting(["equal"])

        if (action) assert[action](test, this.get(action), message)
        else assert(test, message)

        return false
    }

}

module.exports = _block;