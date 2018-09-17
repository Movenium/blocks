'use strict';

var isPromise = require("./tools").isPromise

class logger {

    constructor() {
        this.logArr = []
    }

    log(mixed, severity = "info", prefix = "") {
        if (typeof mixed === "string")
            this.logArr.push(prefix + " " + severity + ": " + mixed)
        else {
            const add = {}
            add[prefix + " " + severity] = mixed
            this.logArr.push(add)
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
        return this.logArr
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
}


module.exports = logger;