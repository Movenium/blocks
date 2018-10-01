'use strict';
var block = require('./block');
var jwt = require('jsonwebtoken');
var assert = require("assert")

class _block extends block {
    run() {
        if (this.exists("verify")) {
            assert(this.get("verify"), "cannot verify null jwt")
            const token = this.get("verify").startsWith("Bearer ") ? this.get("verify").substring(7) : this.get("verify")
            return jwt.verify(token, this.get("private").replace(/\n/g, "\n"))
        }
    }
}

module.exports = _block;