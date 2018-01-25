'use strict';
var block = require('./block')
var crypto = require('crypto');
var ReturnError = require('../blocks').ReturnError

class data extends block {
    run(settings, resolve, reject) {

        if (typeof settings.code !== "undefined") {

            var cipher = crypto.createCipher('aes-256-ctr', settings.password);

            const salt = crypto.randomBytes(8);

            const data = settings.code

            data.salt = salt;

            var result = cipher.update(JSON.stringify(data), 'utf8', 'hex')
            result += cipher.final('hex');

            resolve({token: result})
        }
        else if (settings.token) {
            var decipher = crypto.createDecipher('aes-256-ctr', settings.password);

            var dec = decipher.update(settings.token,'hex','utf8')
            dec += decipher.final('utf8');

            let parsed = JSON.parse(dec);
            delete parsed.salt

            resolve(parsed)
        }
        else
            reject(new ReturnError("Authorization header needed", 401));
    }
}


module.exports = data;