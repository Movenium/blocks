'use strict';

var fs = require('fs');
var yaml = require("node-yaml")
var tools = require('./tools')
var blockBase = require("./blocks/block")
var Promise = require("promise")

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
module.exports.dynamicBlocks = {};

module.exports.run = (blockList, state, callback = null) => {

    if (callback) {
        this.runPromise(blockList, state).then((response) => {

            callback(null, response);
        }).catch((error) => {
            callback(error)
        })
    }
    else
        return this.runPromise(blockList, state);
}

module.exports.runPromise = (blockList, state) => {

    return new Promise((resolve, reject) => {
        if (!this.rootdir) {
            this.rootdir = require('app-root-dir').get();
        }

        /*if (!innercall) {
            if (typeof blockList === "string")
                this.initialBlockList = blockList;
            this.checkBlocksHeaders(state);
        }*/

        try {

            if (!blockList) {
                callback(null, null);
                return;
            }

            if (typeof blockList !== "object")
                blockList = [blockList]

            let promises = [];
            let lastOne = state._last;
            blockList.forEach( (block) => {
                lastOne = this._runBlock(block, state, lastOne);
                /*lastOne.then((resp) => {
                    console.log(block, "resolves", resp)
                },(resp) => {
                    console.log(block, "rejectes", resp)
                })*/

                lastOne.catch(reject);

                state[this.getBlockOutput(block)] = lastOne

                promises.push(lastOne);
            });

            lastOne.then(resolve).catch(reject);
        }
        catch (e) {
            reject(e);
        }
    });
}

module.exports.getBlockOutput = (block) => {

    let blockName;
    if (typeof block === "object") {
        const keys = Object.keys(block);
        blockName = keys[0];
    }
    else
        blockName = block

    const blockArr = blockName.split(" > ");

    if (blockArr.length === 2) {
        return blockArr[1];
    }
    return blockName
}

module.exports.getDynamicName = (block) => {

    let blockName;
    if (typeof block === "object") {
        const keys = Object.keys(block);
        blockName = keys[0];
    }
    else
        blockName = block

    const blockArr = blockName.split(" => ");

    if (blockArr.length === 2) {
        return blockArr[1];
    }
    return null
}

module.exports.parseBlock = (block, state) => {

    return new Promise((resolve, reject) => {
        let settings = {};

        // if its object read settings
        if (typeof block === "object") {
            const keys = Object.keys(block);
            const blockName = keys[0];
            this.parseSettings(block[blockName], state).then((settings) => {

                // real name of the block after getting settings
                block = blockName;
                const openedBlock = this.readBlock(block, state);

                openedBlock.settings = settings;

                resolve(openedBlock)
            }, reject)
        }
        else {
            const openedBlock = this.readBlock(block, state);
            openedBlock.settings = settings;
            resolve(openedBlock)
        }
    })
}

module.exports.readBlock = (block, state) => {

    if (block.indexOf(" => ") !== -1) {
        const splitted_block = block.split(" => ");
        return {type: "creator", block: splitted_block[0], dynamic: splitted_block[1], output: null};
    }

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

    if (Object.keys(tools.get(state, '__dynamicBlocks')).indexOf(block) !== -1) {
        return {type: "dynamic", useblock: state.__dynamicBlocks[block], output: output};
    }

    return {type: "js", file: block, output: output};
}

module.exports.parseSettings = (settings, state) => {

    return new Promise((resolve, reject) => {
        if (!settings) {
            resolve({});
            return;
        }

        const promises = [];

        for (const key of Object.keys(settings)) {
            promises.push(this.parseSetting(key, settings[key], state));
        }


        Promise.all(promises).then((results) => {

            let count = 0;
            for (const key of Object.keys(settings)) {
                settings[key] = results[count++]
            }
            resolve(settings)
        }).catch(reject);
    });
}

module.exports.parseSetting = (name, value, state) => {

    return new Promise((resolve, reject) => {

            if (name.substring(0,1) === "_") {
                resolve(value)
            }
            else if (typeof value === "number") {
                resolve(value)
            }
            else if (typeof value === "string") {
                if (value.match(/^\$/g)) {
                    if (value.match(/^\$\$/g))
                        resolve(value.substring(1))
                    else {
                        const key = value.substring(1)
                        tools.resolveGet(state, key).then(resolve, reject)
                    }

                }
                else
                    resolve(value);
            }
            else if (typeof value === "object") {
                this.parseSettings(value, state).then(resolve).catch(reject);
            }

    });
}

module.exports._runBlock = (block, state, lastOne) => {

    const promise = new Promise( (resolve, reject) => {
        this.parseBlock(block, state).then((blockObj) => {

            if (blockObj.type === "creator") {
                resolve({type: "js", file: blockObj.block, settings: blockObj.settings})
            }
            else if (blockObj.type === "dynamic") {
                blockObj.useblock.then((useBlock => {
                    console.log("running dynamic", Object.assign(useBlock.settings, blockObj.settings))
                    this._runBlock({
                        type: useBlock.type,
                        file: useBlock.file,
                        settings: Object.assign(useBlock.settings, blockObj.settings)
                    }, state).then(resolve).catch(reject);
                }), reject)

            }
            else if (blockObj.type === "js") {
                const _block = this._requireJs(blockObj.file);
                if (!_block) return new Promise( (resolve, reject) => {
                    reject(new Error("Block '" + blockObj.file + "' cannot be found."));
                });

                blockObj.settings._last = lastOne

                if (typeof _block.run === "function")
                    _block.run(blockObj.settings, resolve, reject)
                else
                    (new _block(state)).run(blockObj.settings, resolve, reject)
            }
            else if (blockObj.type === "blockList") {
                this.runPromise(blockObj.list, state).then(resolve).catch(reject);;
            }
            else if (blockObj.type === "request") {
                let settings = blockObj.settings;
                settings.url = blockObj.url;

                let block = {};
                block["request" + (blockObj.output ? " > " + blockObj.output : "")] = settings;
                this.runPromise([block], state).then(resolve).catch(reject);;
            }
            else {
                reject(new Error("Unknown block type: '" + blockObj.type + "'"));
            }

        }).catch(reject);
    })

    if (this.getDynamicName(block)) {
        if (typeof state.__dynamicBlocks === "undefined") state.__dynamicBlocks = {};
        state.__dynamicBlocks[this.getDynamicName(block)] = promise
    }

    return promise
}

module.exports._requireJs = (file, callback) => {

    const paths = ['./blocks/', this.rootdir + "/", this.rootdir + "/node_modules/@vvsalmin/blocks/blocks/"];

    for (const path of paths) {
        //console.log("require", path + file)
        const required = this.tryRequire(path + file);
        if (required) return required;
    }

    //callback(new Error("Block '" + file + "' cannot be found. Searched from " + JSON.stringify(paths)));
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

module.exports.checkBlocksHeaders = (state) => {
    const headers = tools.get(state, "event.headers");

    if (tools.get(headers, 'X-blocks-record')) {
        state._recording = "./test/" + tools.get(headers, 'X-blocks-record')
    }
}