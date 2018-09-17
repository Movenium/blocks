'use strict';
var block = require('./block');

class _block extends block {
    run() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.get("ret", null))
            }, this.get("time", this.settings))
        })
    }
}

module.exports = _block;