'use strict';
var block = require('./block');
var blocks = require('../blocks');
var isPromise = require('../tools').isPromise;
var yaml = require('node-yaml');
const SAFE_SCHEMA = yaml.schema && yaml.schema.defaultSafe ? yaml.schema.defaultSafe : yaml.DEFAULT_SAFE_SCHEMA

class _block extends block {
    run() {
        const blockObj = yaml.readSync(this.blocks.rootdir + this.get("filename"), {encoding: "utf8", schema: SAFE_SCHEMA})

        try {
            const ret = (new blocks(this.blocks.logger, this.settings, this.get("filename"), this.mocker))._run(blockObj, this.settings)
            if (isPromise(ret)) return ret
            return new Promise((resolve) => {resolve(ret)})
        }
        catch(reason) {
            return new Promise((resolve, reject) => {reject(reason)})
        }
    }
}

module.exports = _block;