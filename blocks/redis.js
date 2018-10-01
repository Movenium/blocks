'use strict';
var block = require('./block');
var redis = require('redis');

class _block extends block {
    run() {
        return new Promise((resolve, reject) => {
            const client = redis.createClient();

            const action = this.firstExisting(["get"])

            client[action](this.get(action), function(err, value) {
                if (err) reject(err)
                resolve(value)
            });
        })

    }
}

module.exports = _block;