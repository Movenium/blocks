'use strict';
var blocks = require('../blocks');
var tools = require('../tools');
var fs = require('fs');
var md5 = require('md5');

class block {

    constructor(state = null) {
        this.state = state;
    }

    run(settings, state, callback) {
        callback("Base class 'block' cannot be used directly");
    }

    runBlockList(blockList, state, callback) {
        blocks.run(blockList, state, callback, true);
    }

    testMode () {
        return tools.get(this.state, "_testmode");
    }

    capsuleAPIcall(capsule, params, callback = null) {

        if (!callback) {
            if (tools.get(this.state, "_recording")) {
                const response = capsule(...params);
                this.saveRecordingToState(this.constructor.name, params, this.state, response);
                return response;
            }
            else if (this.testMode()) {
                return this.getRecordedAPIresponse(params);
            }
            else {
                return capsule(...params);
            }
        }

        if (tools.get(this.state, "_recording")) {
            params.push(this.recordAPIresponse.bind({params: JSON.stringify(params), state: this.state, callback: callback, name: this.constructor.name}))
            capsule(...params);
        }
        else if (this.testMode()) {
            const testArgs = this.getRecordedAPIresponse(params);
            callback(...testArgs);
        }
        else {
            params.push(callback)
            capsule(...params);
        }

    }

    stateget(path) {
        return tools.get(this.state, path);
    }

    parseSetting(value) {
        if (typeof value === "string" && value.match(/^\$/g)) {
            return tools.get(this.state, value.substring(1))
        }

        return value;
    }

    getRecordedAPIresponse(params) {
        //console.log("get key", JSON.stringify(params), md5(JSON.stringify(params)))
        const key = this.constructor.name + "_" + md5(JSON.stringify(params));

        if (!tools.get(this.state, "_recorded"))
            throw new Error("Block cannot be tested. Capsuled API call found but test has no recording loaded.");

        const testArgs = tools.get(this.state, "_recorded." + key);

        const found_keys = tools.get(this.state, "_recorded") ? Object.keys(tools.get(this.state, "_recorded")).join(",") : "";

        if (!testArgs)
            throw new Error("Block cannot be tested. Capsuled API call found but test has not been recorded. Key: '" + key + "' not found from: [" + found_keys + "]. Params for key were: " + JSON.stringify(params));

        return testArgs;
    }

    recordAPIresponse(...args) {
        const key = this.name + "_" + md5(this.params);

        if (!this.state._recorded) this.state._recorded = {};

        this.state._recorded[key] = args;
        this.state._recorded[key + "_params"] = this.params.slice(0, this.params.length - 1);

        this.callback(...args);
    }

    saveRecordingToState(name, params, state, save) {
        const key = name + "_" + md5(JSON.stringify(params));

        if (!state._recorded) state._recorded = {};

        state._recorded[key] = save;
        state._recorded[key + "_params"] = params.slice(0, params.length - 1);
    }
}

module.exports = block;