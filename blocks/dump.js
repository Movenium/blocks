'use strict';
var block = require('./block');

class _block extends block {
    run() {
        this.log(this.settings, "dump")
    }
}

module.exports = _block;