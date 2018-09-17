'use strict';
var yaml = require('node-yaml');
var isPromise = require('./tools').isPromise

class blocks {

    constructor(logger, settings = {}, depth = 0) {
        this.state = settings
        this.logger = logger
        this.depth = depth + 1

        this.debug = {}
        this.rootdir = require('app-root-dir').get() + "/"
    }

    run(blockObj, settings = {}) {
        return this["run_" + this.getTypeOf(blockObj)](blockObj, settings)
    }

    getTypeOf(blockObj) {
        if (typeof blockObj === "string") {
            if (blockObj.match(/.yml$/g)) return "yaml"
            return "js"
        }

        return "list"
    }

    run_yaml(filename, settings) {
        settings.filename = filename
        return this.run_js("_yaml", settings)
    }

    run_list(blockList) {
        let promises = []
        blockList.forEach((blockObj) => {
            this.log("execute " + JSON.stringify(blockObj))

            const fileObj = this.getFileObj(blockObj)
            const ret = this.run(fileObj.filename, fileObj.settings)
            this.add_state(fileObj.saveto, ret)
            promises.push(ret)
            this.logger.runned(fileObj, ret, this.depth)
        })

        // we wan't to wait all the possible promises resolves before continuing
        // if all promises are not waited "late rejections" might cause errors
        return new Promise((resolve, reject) => {
            Promise.all(promises).then((resolved) => {
                resolve(resolved[resolved.length - 1])
            }, reject)
        })
    }

    getFileObj(blockObj) {
        let key, filename, saveto = null, settings = {}
        if (typeof blockObj === "string")
            key =  blockObj
        else {
            key = Object.keys(blockObj)[0]
            settings = blockObj[key]
        }

        const splittedKey = key.split(" > ")

        if (splittedKey.length > 1) {
            filename = splittedKey[0]
            saveto = splittedKey[1]
        }
        else {
            filename = key
            // get 'userActivity' out of 'routes/userActivity.yml'
            saveto = key.split(".")[0].split("/").pop()
        }

        return {filename: filename, saveto: saveto, settings: settings}
    }

    run_js(filename, settings) {
        const path = filename.startsWith("/") ? "./node_modules/@movenium/blocks/blocks" : "./blocks/"
        let js = require(path + filename)
        return (new js(this, filename, settings))._run()
    }

    add_state(name, values) {
        if (typeof this.state[name] !== "undefined") throw new Error("Cannot save to '" + name + "' already in use")
        this.state[name] = values
    }

    log(str, severity = "info", prefix = "") {
        this.logger.log(str, severity, Array(this.depth).join("    ") + prefix)
    }
}

module.exports = blocks;