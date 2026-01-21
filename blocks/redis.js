'use strict';
var block = require('./block');
var redis = require('redis');

class _block extends block {
    run() {
        return this.mocker.newPromise((resolve, reject) => {
            const options = this.exists("url") ? {url: this.get("url")} : {}
            const client = redis.createClient({...options, legacyMode: true})
            const cleanup = () => client.quit().catch(() => {})

            client.on('error', (err) => {
                cleanup()
                reject(err)
            })

            client.connect().then(() => {
                const action = this.firstExisting(["get"])
                if (!action) {
                    cleanup()
                    return resolve(null)
                }

                client[action](this.get(action), function(err, value) {
                    cleanup()
                    if (err) return reject(err)
                    resolve(value)
                });
            }).catch((err) => {
                cleanup()
                reject(err)
            })
        }, this.settings)

    }
}

module.exports = _block;