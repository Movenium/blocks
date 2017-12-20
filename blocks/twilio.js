'use strict';
var block = require('@vvsalmin/blocks').block;
var twilio = require('twilio');

class _block extends block {
    run(settings, state, callback) {
        // send sms-response
        var ret;
        if (settings.send) {
            ret = this.sendResponse(settings);
        }
        // parse request body
        if (settings.parse) {
            ret = this.parseRequestBody(settings);
        }
        callback(null, ret)
    }
    sendResponse(settings) {
        var authArr = settings.auth.split(":");
        var client = new twilio(authArr[0], authArr[1]);

        var message = {
            body: settings.send,
            to: settings.phone.replace("%2B", "+"),  // Text this number
            from: settings.phoneTo.replace("%2B", "+") // From a valid Twilio number
        };

        client.messages.create(message)
            .then((message) => console.log(message.sid));
    }
    parseRequestBody(settings) {
        // twilio returns string values separated by &-char
        var bodyArr = settings.parse.split("&");
        var indexArr = [];
        // make indexed array for easier access to variables
        for(var row of bodyArr) {
            var tmp = row.split("=");
            indexArr[tmp[0]] = tmp[1];
        }

        var returnArr = [];

        // parse message
        var messageArr = indexArr["Body"].split("+");

        var i = 0;
        // get all fields that need to be parsed
        for (var field of settings.parseFields) {
            returnArr[field] = messageArr[i];
            i++;

        }

        // get phone-number
        returnArr["phone"] = indexArr["From"];

        // get twilio phonenumber
        returnArr["phoneTo"] = indexArr["To"];

        return returnArr;
    }
}

module.exports = _block;
