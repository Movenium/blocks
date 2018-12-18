'use strict';

var isPromise = require("./tools").isPromise
var mustache = require('mustache');
var fs = require('file-system');

class logger {

    constructor() {
        this.logArr = []
        this.dumps = []
        this.starttime = new Date().getTime()
        this.resolveOrder = 1
    }

    dump(mixed) {
        this.dumps.push({dump: this.formatObject(mixed, Number.MAX_VALUE)})
    }

    log(mixed, severity = "info", prefix = "") {

        if (severity === "dump") return this.dump(mixed)

        this.logArr.push(mixed)

        if (isPromise(mixed.settings)) {
            mixed.settings.then((resolved) => {
                mixed.settings = this.formatObject(resolved)
                mixed.settingsIsPromise = true
                mixed.settingsResolveOrder = this.resolveOrder++
                mixed.starttime = (new Date().getTime()) - this.starttime
            }).catch(() => {})
        }
        else {
            mixed.settings = this.formatObject(mixed.settings)
            mixed.settingsResolveOrder = this.resolveOrder++
            mixed.starttime = (new Date().getTime()) - this.starttime
        }

        if (isPromise(mixed.ret)) {
            mixed.ret.then((resolved) => {
                mixed.ret = this.formatObject(resolved)
                mixed.retIsPromise = true
                mixed.retResolveOrder = this.resolveOrder++
                mixed.endtime = (new Date().getTime()) - this.starttime
                mixed.time = mixed.endtime - mixed.starttime
            }).catch(() => {})
        }
        else {
            mixed.ret = this.formatObject(mixed.ret)
            mixed.retResolveOrder = this.resolveOrder++
            mixed.endtime = (new Date().getTime()) - this.starttime
            mixed.time = mixed.endtime - mixed.starttime
        }
    }

    runned(obj, ret, depth) {

        if (isPromise(ret)) {
            ret.then((resolved) => {
                this.logArr.push({type: obj.filename, saveto: obj.saveto, settings: obj.settings, return: resolved})
            })
        }
        else {
            this.logArr.push({type: obj.filename, saveto: obj.saveto, settings: obj.settings, return: ret})
        }

    }

    getLog() {
        return {dump: this.dumps, trace: this.logArr}
    }

    logPromise(mixed) {
        if (isPromise(ret)) {
            this.log("promise created " + blockObj + " - " + JSON.stringify(ret))
            ret.then((resolved) => {
                this.log("resolved(promise) " + blockObj + " - " + JSON.stringify(resolved))
            }, (reason) => {
                this.log("rejected(promise) " + blockObj + " - " + JSON.stringify(reason))
            })
        }
        else
            this.log("resolved " + blockObj + " - " + JSON.stringify(ret))
    }

    asHTML(response = null, error = null) {

        const template = fs.readFileSync('./node_modules/@movenium/blocks/views/debug.html', 'utf-8');

        var view = {
            dumps: this.dumps,
            response: this.formatObject(response),
            error: typeof error === "string" ? {message: error} : error,
            time: new Date().getTime() - this.starttime,
            blocks: this.logArr.sort((a,b) => {return a.retResolveOrder - b.retResolveOrder}),
        };
        return {statusCode: 200, headers: {'Content-Type': 'text/html'}, body: mustache.to_html(template, view)}

    }

    formatObject(mixed, maxlen = 5000) {
        if (!mixed) return null
        const json = JSON.stringify(mixed, null, 4)

        if (json.length > maxlen) return json.substring(0, maxlen) + "\n..."
        else return json
    }
}


module.exports = logger;