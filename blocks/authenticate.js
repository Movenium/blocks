'use strict';
var block = require('./block')
var tools = require('../tools')
var ReturnError = require("../blocks").ReturnError

class data extends block {
    run(settings, state, callback) {

        const token = settings.auth || tools.get(state, "event.headers.Authorization")

        if (!token) callback(new ReturnError("Unauthorized", 401))

        callback(null, state.default)
    }
}


module.exports = data;