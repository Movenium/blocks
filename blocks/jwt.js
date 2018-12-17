'use strict';
var block = require('./block');
var jwt = require('jsonwebtoken');
var assert = require("assert")

class _block extends block {
    run() {
        if (this.exists("verify")) {
            assert(this.get("verify", null), "cannot verify null jwt")
            const token = this.get("verify").startsWith("Bearer ") ? this.get("verify").substring(7) : this.get("verify")

            // if we are mocking do not call jwt.verify because it will result "token expired"
            if (this.mocker.mode === "mock") return this.mocker.mockValue(null, token)

            const decoded_jwt = jwt.verify(token, this.get("private").replace(/\n/g, "\n"))
            return this.mocker.mockValue(decoded_jwt, token)
        }
    }
}

module.exports = _block;