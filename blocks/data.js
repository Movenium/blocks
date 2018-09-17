'use strict';
var block = require('./block');

class _block extends block {
    run() {
        return this.settings
    }
}

module.exports = _block;