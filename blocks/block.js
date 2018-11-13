'use strict';

const get = require("../tools").get
const isPromise = require("../tools").isPromise
var blocks = require('../blocks');

class block {

    constructor(blocks, filename, settings) {
        this.blocks = blocks
        this.filename = filename
        this.settings = settings
        this.settingsPromise = null
    }


    /*
    _run() {
        console.log("resolve", this.settings)
        const ret = this.resolver(this, "settings")

        // promises found so let's wait resolving and return new promise
        if (isPromise(ret)) {
            return new Promise((resolve, reject) => {
                // catch rejections
                ret.then(() => {
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

    resolver(obj, branch) {
        const settings = obj[branch]
        if (typeof settings === "string") {
            obj[branch] = this.resolveDollar(settings)
            return obj[branch]
        }

        const promises = []
        for (let key in settings) {

            if (Array.isArray(settings)) {
                const ret = this.resolver(settings, key)
                if (isPromise(ret)) promises.push(this.resolveIfPromise(settings, key, settings[key]))
                else settings[key] = ret
            }
            else if (key.startsWith('$')) {
                this.resolver(settings, key)
                promises.push(this.resolveIfPromise(settings, key.substring(1), settings[key]))
                delete settings[key]
            }
            else if (key.startsWith('\\$')) {
                promises.push(this.resolveIfPromise(settings, key.substring(1), this.resolveDollar(settings[key])))
                delete settings[key]
            }
            else {
                promises.push(this.resolveIfPromise(settings, key, this.resolveDollar(settings[key])))
            }
        }

        if (promises.filter((promise) => {return promise ? true : false}).length == 0) return settings;

        return new Promise((resolve, reject) => {
            Promise.all(promises).then(() => {resolve(settings)}, reject)
        })
    }*/

    _run() {
        this.settingsPromise = this.resolveSettings(this.settings)

        // promises found so let's wait resolving and return new promise
        if (isPromise(this.settingsPromise)) {
            return new Promise((resolve, reject) => {
                // catch rejections
                this.settingsPromise.then((resolvedSettings) => {
                    this.settings = resolvedSettings
                    try {
                        resolve(this.run())
                    }
                    // catch non promise errors - these can happen if run throws errors
                    catch (reason) {
                        console.log(reason)
                        reject(reason)
                    }
                }, reject)
            })
        }
        else {
            this.settings = this.settingsPromise
            return this.run()
        }
    }

    run() {
        throw new Error("block run should always be overwritten")
    }

    firstExisting(keys) {
        for (let key of keys) if (this.exists(key)) return key
    }

    log(str, severity = "info", prefix = "") {
        this.blocks.log(str, severity, prefix + this.filename)
    }

    dump(mixed) {
        this.log(mixed, "dump")
    }

    get(path, def = undefined) {

        const value = get(this.settings, path)

        if (typeof value === "undefined") {

            if (typeof def !== "undefined")
                return def
            else
                throw new Error("value '" + path + "' not set for " + this.filename + " " + value)
        }
        return value
    }

    exists(name) {
        return typeof this.settings[name] !== "undefined"
    }

    resolveSettings(settings) {

        if (typeof settings === "string") return this.resolveDollar(settings)

        const promises = []
        for (let key in settings) {

            if (Array.isArray(settings)) {
                const ret = this.resolveSettings(settings[key])
                if (isPromise(ret)) promises.push(this.resolveIfPromise(settings, key, settings[key]))
                else settings[key] = ret
            }
            else if (key.startsWith('$')) {
                this.resolveSettings(settings[key])
                promises.push(this.resolveIfPromise(settings, key.substring(1), settings[key]))
                delete settings[key]
            }
            else if (key.startsWith('\\$')) {
                promises.push(this.resolveIfPromise(settings, key.substring(1), this.resolveDollar(settings[key])))
                delete settings[key]
            }
            else {
                promises.push(this.resolveIfPromise(settings, key, this.resolveDollar(settings[key])))
            }
        }

        if (promises.filter((promise) => {return promise ? true : false}).length == 0) return settings;

        return new Promise((resolve, reject) => {
            Promise.all(promises).then(() => {resolve(settings)}, reject)
        })
    }

    resolveIfPromise(object, key, value) {
        if (isPromise(value)) {
            value.then((resolved) => {object[key] = this.removeLeadingSlashDollar(resolved)})
            return value
        } else {
            object[key] = this.removeLeadingSlashDollar(value)
            return null
        }
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
        if (typeof str === "string" && str.startsWith("$")) return get(this.blocks.state, str.substring(1), "undefined")
        return str
    }

    runBlockList(blockList, settings = {}) {
        return (new blocks(this.blocks.logger, {...this.blocks.state, ...settings}, this.blocks.depth)).run(blockList)
    }

}

module.exports = block;