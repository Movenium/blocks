'use strict';
var block = require('./block');

class _block extends block {
    run() {

        if (this.get("dump", false)) return this.blocks.logger.asHTML()

        const body = this.exists("body") ? this.get("body", null) : {message: this.get("message", null)}
        if (this.get("meta", false)) body.meta = this.blocks.logger.getLog()

        return {statusCode: this.get("statusCode", 200), body: JSON.stringify(body), headers: this.get("headers", {})}
    }
}

module.exports = _block;