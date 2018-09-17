'use strict';
var block = require('./block');

class _block extends block {
    run() {
        const body = JSON.stringify({message: this.get("message"), meta: this.blocks.logger.getLog()})
        return {statusCode: this.get("statusCode", 200), body: body}
    }
}

module.exports = _block;