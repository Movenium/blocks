'use strict';
var block = require('../blocks').block;
var moment = require('moment-timezone');

class _moment extends block {
    run(settings, state, callback) {

        for (const key in settings) {
            const parser = settings[key].split(/ /);

            let ret = moment(this.capsuleAPIcall(() => {
                return moment().format();
            }, []));

            for (let i = 0; i < parser.length; i += 2) {
                const param = parser[i + 1];
                const params = param ? param.split(",") : []
                try {
                    ret = ret[parser[i]](...params);
                } catch (e) {
                    callback("Moment function '" + parser[i] + "' returned error: " + e.message);
                    return;
                }
            }

            settings[key] = ret;
        }

        callback(null, settings)
    }
}

module.exports = _moment;