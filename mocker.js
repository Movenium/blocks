
/*

mock any external API function easily

 */

const fs = require('fs');
//var Promise = require("bluebird")


class mocker {

    defaultMocker() {
        return {
            mockFunction: function(...params) {
                const func = params.shift()
                return func(...params)
            },
            newPromise: function(callback) {
                return new Promise(callback)
            },
            mockValue: function(value) {
                return value
            },
            recordFullRequest: function(promise) {
                return promise
            }
        }
    }

    constructor(mode = null, params = {}) {
        this.mode = mode
        this.path = params.path ? params.path : "recordings"
        this.debug = params.debug
        this.namespace = params.namespace ? params.namespace : ""

        this.recordings = params.recordings ? params.recordings : []

        this.type = params.type
    }

    createFilename(path, params) {
        return path + "/" + (this.namespace ? this.namespace + "-" : "") + this.createKey(params) + ".json"
    }

    createKey(params) {
        var md5 = require('md5')
        return md5(JSON.stringify(this.filterParams(params)))
    }

    filterParams(params) {
        if (!params) return {}
        if (typeof params.filter !== "function") return params
        return params.filter((param) => typeof param !== "function")
    }

    reformatResponse(response) {
        if (typeof response.map === "function") {
            return response.map((item) => {
                //if (item instanceof Error) return item.toString()
                //else if (item instanceof Date) return "2018-01-01T08:00:00Z"
                return item
            })
        }

        return response
    }

    record(path, params, response) {
        const useParams = this.filterParams(params)

        const data = {
            key: this.createKey(params),
            params: useParams,
            response: this.reformatResponse(response)
        }

        if (this.debug === "full") {
            console.log("with params: '" + JSON.stringify(useParams, null, 2) + "'")
        }

        if (this.type === "collect") {
            this.recordings.push(JSON.parse(JSON.stringify(data)))
        }
        else {
            const filename = path.endsWith(".json") ? path : this.createFilename(path, params)
            console.log("recording to " + filename)
            fs.writeFile(filename, JSON.stringify(data, null, 4), null, () => {})
        }
    }

    writefile(requestParameters, requestResponse, filename) {
        fs.writeFile(filename, JSON.stringify({request: requestParameters, response: requestResponse, recordings: this.recordings}, null, 4), null, () => {})
    }

    mock(path, params) {

        if (this.type === "collect") return this.mockFromRecordingsArray(params)

        const filename = path.endsWith(".json") ? path : this.createFilename(path, params)
        if (this.debug) {
            console.log("mocking " + filename)
        }

        if (!fs.existsSync(filename)) {
            throw new Error("cannot find mock file '" + filename + "' with params: '" + JSON.stringify(this.filterParams(params), null, 2) + "'")
        }

        const data = fs.readFileSync(filename, "utf8")
        const response = JSON.parse(data).response

        if (this.debug === "full") {
            console.log(response)
        }

        return response
    }

    mockFromRecordingsArray(params) {
        const key = this.createKey(params)
        const recording = this.recordings.find((item) => item.key === key)

        if (!recording) {
            throw new Error("cannot find mock '" + key + "' with params: '" + JSON.stringify(this.filterParams(params), null, 2) + "'")
        }

        return recording.response
    }

    /*
    Mock any function that uses callback function

    original request: request(options, (error, response, body) => { ... })
    mocked: this.mocker.mockFunction(request, options, (error, reponse, body) => { ... })

     */
    mockFunction(...params) {

        const func = params.shift()

        const callback = params[params.length - 1]

        if (this.mode === "mock") {
            const callbackparams = this.mock(this.path, params)
            callback(...callbackparams)
            return
        }

        if (this.mode === "record") {
            const useParams = params.slice(0, -1)
            useParams.push((...callbackparams) => {
                this.record(this.path,params,callbackparams)
                callback(...callbackparams)
            })
            func(...useParams)
            return
        }

        return func(...params)
    }

    /*
    Create a new promise that is mocked automatically

    parameters: any object that is used as key to recognize recorded response

    original format: return new Promise((resolve, reject) => { ... })
    mocked: return this.mocker.newPromise((resolve, reject) => { ...}, parameters)

     */
    newPromise(func, parameters) {
        if (this.mode === "mock") {
            const mocked = this.mock(this.path, parameters)

            return new Promise((resolve, reject) => {
                if (mocked[0] == "resolve") {
                    resolve(mocked[1])
                }
                else if (mocked[0] == "reject") {
                    reject(mocked[1])
                }
                else {
                    throw new Error("Unknown response type: " + mocked[0])
                }
            })
        }

        if (this.mode === "record") {
            const savedParameters = parameters ? JSON.parse(JSON.stringify(parameters)) : parameters
            return new Promise((resolve, reject) => {
                func((resolved) => {
                    this.record(this.path,savedParameters,["resolve", resolved])
                    resolve(resolved)
                }, (reason) => {
                    this.record(this.path,savedParameters,["reject", reason.toString()])
                    reject(reason)
                })
            })
        }

        return new Promise(func)
    }

    /*

    Mock any value that is changed over time

    parameters: any object that is used as key to recognize recorded response

    original format: return moment().toString()
    mocked: return this.mocker.mockValue(moment().toString(), parameters)

     */
    mockValue(value, parameters = null) {
        if (this.mode === "mock") {
            return this.mock(this.path, parameters)
        }

        if (this.mode === "record") {
            this.record(this.path,parameters,value)
            return value
        }

        return value
    }

    recordFullRequest(promise, parameters = null, filename = null) {

        if (this.mode === "mock") {
            return promise
        }

        if (this.mode === "record") {
            promise.then((response) => {
                this.writefile(parameters,["resolve", response], this.path + "/" + filename + ".json")
            }).catch((reason) => {
                this.writefile(parameters,["reject", reason], this.path + "/" + filename + ".json")
            })

            return promise
        }

        return promise
    }


}

module.exports = mocker;