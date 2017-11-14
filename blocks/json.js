'use strict';
var block = require('./block')

class json extends block {
    run(settings, state, callback) {

        try {
            if (typeof settings.parse !== "undefined")
                callback(null, JSON.parse(settings.parse));
            else if (typeof settings.stringify !== "undefined")
                callback(null, JSON.stringify(settings.stringify));
            else
                callback(new Error("give either parse or stringify setting"));
        }
        catch (e) {
            callback(e);
        }
    }
}


module.exports = json;