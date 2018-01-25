'use strict';
var block = require('./block')

class template extends block {
    run(settings, resolve) {

        const template = settings.template;

        resolve(settings.template.replace(/{([^}]+)}/g, (match) => {
            const replace = match.substring(1,match.length - 1)
            return settings[replace]
        }));
    }
}


module.exports = template;