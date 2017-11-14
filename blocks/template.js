'use strict';
var block = require('./block')

class template extends block {
    run(settings, state, callback) {

        const template = settings.template;

        callback(null, settings.template.replace(/{([^}]+)}/g, (match) => {
            const replace = match.substring(1,match.length - 1)
            return settings[replace]
        }));
    }
}


module.exports = template;