'use strict';
var block = require('./block');

class _block extends block {
    run() {
        return JSON.parse(this.settings)
    }
}

module.exports = _block;