'use strict';

var fs = require('fs');
var yaml = require("node-yaml")
var tools = require('./tools')
var blockBase = require("./blocks/block")

var moment;

class ReturnError extends Error {
    constructor(mixed, errorcode) {
        super(mixed)
        if (typeof mixed === "object") this.response = mixed
        this.errorcode = errorcode;
        Error.captureStackTrace(this, ReturnError)
    }
}

module.exports.ReturnError = ReturnError;
module.exports.block = blockBase;

module.exports.run = (blockList, state, callback, innercall = false) => {

    if (!this.rootdir) {
        this.rootdir = require('app-root-dir').get();
    }

    if (!innercall) {
        if (typeof blockList === "string")
            this.initialBlockList = blockList;
        this.checkBlocksHeaders(state);
    }

    try {

        if (!blockList) {
            callback(null, null);
            return;
        }

        if (typeof blockList !== "object")
            blockList = [blockList]

        const block = blockList.shift();

        const blockObj = this.parseBlock(block, state);

        const useCallback = (error, response) => {

            if (error) {
                callback(error);
                return;
            }

            state.default = response;

            if (blockObj.type === "js" && blockObj.output) {
                state[blockObj.output] = response;
            }

            if (blockList.length > 0) {
                this.run(blockList, state, callback, true);
            }
            else {
                if (!innercall) {
                    this.saveRecordingToFile(state, state.default, this.initialBlockList);
                }
                callback(null, response);
            }
        };

        this._runBlock(blockObj, state, useCallback);
    }
    catch (e) {
        this.handleError(e, callback);
    }
}

module.exports.saveRecordingToFile = (state, response, blockListToTest) => {

    if (!tools.get(state, "_recording")) return;

    if (!blockListToTest) throw new Error("Only support type for test recording is yml for now");

    const stream = fs.createWriteStream(tools.get(state, "_recording"));

    if (!state._recorded) state._recorded = {};

    state._recorded.response = response;

    if (tools.get(state, 'event')) state._recorded.event = tools.get(state, 'event');

    const testarray = [
        {
            "data > _recorded": {data: tools.get(state, "_recorded")}
        },
        {
            "data > event": {
                "data": "$_recorded.event"
            }
        },
        blockListToTest,
        {
            "test": {
                "default": "$_recorded.response"
            }
        }
    ];


    stream.once('open', function(fd) {
        stream.write(JSON.stringify(testarray));
        stream.end();
    });
}

module.exports.parseBlock = (block, state) => {

    let settings = {};

    // if its object read settings
    if (typeof block === "object") {
        const keys = Object.keys(block);
        const blockName = keys[0];
        settings = this.parseSettings(block[blockName], state)
        // real name of the block after getting settings
        block = blockName;
    }

    const openedBlock = this.readBlock(block);

    openedBlock.settings = settings;
    return openedBlock;
}

module.exports.readBlock = (block) => {

    const blockArr = block.split(" > ");
    let output;

    if (blockArr.length === 2) {
        block = blockArr[0];
        output = blockArr[1];
    }
    else {
        output = block;
    }

    if (output.indexOf("/") !== -1) {
        output = output.substring(output.lastIndexOf('/') + 1);
    }

    if (block.match(/.json$/g)) {
        return {type: "blockList", "list": JSON.parse(fs.readFileSync(this.rootdir + "/" + block, 'utf8'))};
    }

    if (block.match(/.yml$/g)) {
        //const filename = block.substring(0,1) === "." ? block : "../../" + block;
        return {type: "blockList", "list": yaml.readSync(this.rootdir + "/" + block, {encoding: "utf8", schema: yaml.schema.defaultSafe})}
    }

    if (block.match(/^https?:\/\//g)) {
        return {type: "request", url: block, output: output}
    }

    return {type: "js", file: block, output: output};
}

module.exports.parseSettings = (settings, state) => {

    if (!settings) return null;

    for (const key of Object.keys(settings)) {
        settings[key] = this.parseSetting(key, settings[key], state);
    }

    return settings;
}

module.exports.parseSetting = (name, value, state) => {

    if (typeof value === "string" && value.match(/^\$/g)) {

        if (value.match(/^\$\$/g))
            return value.substring(1)
        else
            return tools.get(state, value.substring(1))
    }
    else if (typeof value === "object") {
        return this.parseSettings(value, state);
    }

    return value;
}

module.exports._runBlock = (blockObj, state, callback) => {
    if (blockObj.type === "js") {
        const _block = this._requireJs(blockObj.file, callback);
        if (!_block) return;

        if (typeof _block.run === "function")
            _block.run(blockObj.settings, state, callback);
        else
            (new _block(state)).run(blockObj.settings, state, callback);
    }
    else if (blockObj.type === "blockList") {
        this.run(blockObj.list, state, callback, true);
    }
    else if (blockObj.type === "request") {
        let settings = blockObj.settings;
        settings.url = blockObj.url;
        
        let block = {};
        block["request" + (blockObj.output ? " > " + blockObj.output : "")] = settings;
        this.run([block], state, callback, true);
    }
    else
        callback(new Error("Unknown block type: '" + blockObj.type + "'"));
}

module.exports._requireJs = (file, callback) => {

    const paths = ['./blocks/', this.rootdir + "/"];

    for (const path of paths) {
        const required = this.tryRequire(path + file);
        if (required) return required;
    }

    callback(new Error("Block '" + file + "' cannot be found"));
}

module.exports.tryRequire = (path, callback) => {
    try {
        return require(path);
    }
    catch (e) {
        if (e instanceof Error && e.code === "MODULE_NOT_FOUND")
            return null;
        else
            throw e;
    }
}

module.exports.handleError = (error, callback) => {
    console.log("error cauth")
    if (error instanceof this.ReturnError)
        callback(error);
    else
        callback(error);
}

module.exports.checkBlocksHeaders = (state) => {
    const headers = tools.get(state, "event.headers");

    if (tools.get(headers, 'X-blocks-record')) {
        state._recording = "./test/" + tools.get(headers, 'X-blocks-record')
    }
}