'use strict';

const get = require("../tools").get
const isPromise = require("../tools").isPromise
var blocks = require('../blocks');

class block {

    constructor(blocks, filename, settings) {
        this.blocks = blocks
        this.filename = filename
        this.settings = settings
    }

    _run() {
        const promise = this.resolveSettings(this.settings)

        // promises found so let's wait resolving and return new promise
        if (promise) {
            return new Promise((resolve, reject) => {
                // catch rejections
                promise.then(() => {
                    try {
                        resolve(this.run())
                    }
                    // catch non promise errors - these can happen if run throws errors
                    catch (reason) {
                        reject(reason)
                    }
                }, reject)
            })
        }
        else {
            return this.run()
        }
    }

    run() {

    }

    log(str, severity = "info", prefix = "") {
        this.blocks.log(str, severity, prefix + this.filename)
    }

    get(name, def = undefined) {
        if (typeof this.settings[name] === "undefined") {

            if (typeof def !== "undefined")
                return def
            else
                throw new Error("value '" + name + "' not set for " + this.filename)
        }
        return this.settings[name]
    }

    exists(name) {
        return typeof this.settings[name] !== "undefined"
    }

    resolveSettings(settings) {

        if (typeof settings === "string") {
            const dollarResolved = this.resolveDollar(settings)
            if (isPromise(dollarResolved)) {
                dollarResolved.then((resolved) => this.settings = this.removeLeadingSlashDollar(resolved))
                return dollarResolved
            } else {
                this.settings = this.removeLeadingSlashDollar(dollarResolved)
                return null;
            }
        }

        return this.resolveSettingsObject(settings)
    }

    resolveSettingsObject(settings) {

        if (typeof settings === "string") return settings

        const promises = []
        Object.keys(settings).forEach((key) => {
            const value = this.setting(settings, key)
            if (isPromise(value)) {
                promises.push(value)
                value.then((resolved) => settings[key] = this.removeLeadingSlashDollar(resolved))
            } else {

                // resolve subobject if key starts with $
                if (key.startsWith('$')) {
                    const promise = this.resolveSettingsObject(value)
                    if (isPromise(promise)) {
                        promises.push(promise)
                        promise.then(() => {
                            settings[key.substring(1)] = this.removeLeadingSlashDollar(value)})
                    } else {
                        settings[key.substring(1)] = this.removeLeadingSlashDollar(value)
                    }

                    delete settings[key]
                }
                else {
                    settings[key] = this.removeLeadingSlashDollar(value)
                }
            }
        })

        if (promises.length == 0) return null;

        return Promise.all(promises)
    }

    removeLeadingSlashDollar(str) {
        if (typeof str !== "string") return str
        if (str.startsWith("\\$")) return str.substring(1)
        return str
    }

    setting(settings, path) {
        return this.resolveDollar(get(settings, path))
    }

    resolveDollar(str) {
        if (typeof str === "string" && str.startsWith("$")) return get(this.blocks.state, str.substring(1))
        return str
    }

    runBlockList(blockList) {
        return (new blocks(this.blocks.logger, this.blocks.state, this.blocks.depth)).run(blockList)
    }

}

module.exports = block;