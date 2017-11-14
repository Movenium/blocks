'use strict';
var block = require('blocks').block;
var moment = require('moment');

class _moment extends block {
    run(settings, state, callback) {

        for (const key in settings) {
            const parser = settings[key].split(/ /);

            let ret = moment(this.capsuleAPIcall(() => {
                return moment().format();
            }, []));

            for (let i = 0; i < parser.length; i += 2)
                ret = ret[parser[i]](parser[i + 1]);

            settings[key] = ret;
        }

        callback(null, settings)
    }
}

module.exports = _moment;