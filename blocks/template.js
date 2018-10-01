'use strict';
var block = require('./block');
var redis = require('redis');

class _block extends block {
    run() {
        return this.get("template").replace(/{([^}]+)}/g, (match) => {
            const replace = match.substring(1,match.length - 1)
            return this.get(replace)
        })
    }
}

module.exports = _block;