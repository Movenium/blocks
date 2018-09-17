'use strict';
var block = require('./block');

class _block extends block {
    run() {
        throw new Error(typeof this.settings === "string" ? this.settings : "error thrown by error block")
    }
}

module.exports = _block;