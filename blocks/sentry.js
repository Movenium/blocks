'use strict';
var block = require('./block')

class sentry extends block {
    run(settings, state, callback) {
        var Raven = require('raven');
        Raven.config(settings.url).install();
        Raven.captureException(state.default);
        callback(null, state.default)
    }
}


module.exports = sentry;