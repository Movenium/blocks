'use strict';
var block = require('./block')
var fs = require('fs')

class load extends block {
    /*run(settings, state, callback) {

        const object = JSON.parse(fs.readFileSync(settings.file, 'utf8'))

        if (settings.to) {
            const path = settings.to.split(".")

            let branch = state;
            for (const index in path) {
                const to = path[index];

                if (index == path.length - 1) {
                    branch[to] = object;
                }
                else {
                    if (!branch[to]) branch[to] = {};
                    branch = branch[to];
                }
            }
        }

        callback(null, object)
    }*/
}


module.exports = load;