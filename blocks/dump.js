'use strict';
var block = require('./block');

class _block extends block {
    run() {
        this.log(this.get("dump"), "dump")
    }
}

module.exports = _block;