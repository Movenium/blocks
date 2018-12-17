'use strict';
var yaml = require('node-yaml');
var isPromise = require('./tools').isPromise
var get = require('./tools').get

//var Promise = require("bluebird")
var mockRecorder = require("./mocker")

class blocks {

    constructor(logger = undefined, settings = {}, parent = null, mocker = null) {
        this.state = settings
        this.logger = logger

        this.parent = parent
        this.rootdir = require('app-root-dir').get() + "/"

        this.mocker = mocker ? mocker : (new mockRecorder).defaultMocker()

        this.rerecord = null
    }

    run(blockObj, settings = {}) {
        if (this.useMockerAndRecord(settings)) {
            const filename = this.useMockerAndRecord(settings)
            this.mocker = new mockRecorder("record", {type: "collect"})
            const savedParameters = JSON.parse(JSON.stringify([blockObj, settings, null]))
            this.log({action: "recording unittest to file", filename: filename, parameters: savedParameters}, "dump")
            return this.mocker.recordFullRequest(this._run(blockObj, settings, null), savedParameters, filename)
        }

        return this._run(blockObj, settings)
    }

    useMockerAndRecord(settings) {
        if (this.rerecord) return this.rerecord
        const filename = get(settings, "event.headers.X-blocks-record")
        if (!filename) return false
        return "recording-" + filename
    }

    runMocked(blockObj, settings = {}, filename, recordings, rerecord = false) {

        if (rerecord) {
            this.rerecord = filename
            return this.run(blockObj, settings)
        }

        this.mocker = new mockRecorder("mock", {type: "collect", recordings: recordings})
        //const savedParameters = JSON.parse(JSON.stringify([blockObj, settings, meta]))
        return this.mocker.recordFullRequest(this._run(blockObj, settings), null, filename)
    }

    _run(blockObj, settings = {}, meta = null) {
        return this["run_" + this.getTypeOf(blockObj)](blockObj, settings, meta)
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
            const fileObj = this.getFileObj(blockObj)
            const ret = this.run(fileObj.filename, fileObj.settings, {saveto: fileObj.saveto, parent: this.parent})
            this.add_state(fileObj.saveto, ret)
            promises.push(ret)
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

    run_js(filename, settings, meta) {
        const path = filename.startsWith("/") ? this.rootdir + "blocks" : "./blocks/"
        let js = require(path + filename)
        const js_block = new js(this, filename, settings, this.mocker)
        const ret = js_block._run()
        this.log({execute: filename, meta: meta, settings: js_block.settingsPromise, ret: ret})
        return ret
    }

    add_state(name, values) {
        if (typeof this.state[name] !== "undefined") throw new Error("Cannot save to '" + name + "' already in use")
        this.state[name] = values
    }

    log(str, severity = "info", prefix = "") {
        if (!this.logger) return
        this.logger.log(str, severity, Array(this.depth).join("    ") + prefix)
    }
}

module.exports = blocks;