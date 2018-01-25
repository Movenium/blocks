'use strict';
var block = require('./block')

class json extends block {
    run(settings, resolve, reject) {

        try {
            if (typeof settings.parse !== "undefined")
                resolve(JSON.parse(settings.parse));
            else if (typeof settings.stringify !== "undefined")
                resolve(JSON.stringify(settings.stringify));
            else
                reject(new Error("give either parse or stringify setting"));
        }
        catch (e) {
            reject(e);
        }
    }
}


module.exports = json;