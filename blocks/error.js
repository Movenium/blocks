'use strict';
var block = require('./block');

class _block extends block {
    run() {

        if (this.get("promise", false) === true) {
            return new Promise((resolve, reject) => {reject(new Error("rejected by error block"))})
        }
        else
            throw new Error(typeof this.settings === "string" ? this.settings : "error thrown by error block")
    }
}

module.exports = _block;