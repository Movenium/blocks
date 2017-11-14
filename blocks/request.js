'use strict';

/**
 * Make http request to url and return response
 *
 * settings:
 *   - url: full url for request. Ie: https://google.com
 *   - method: [get, post, put, delete]
 *   - bearer: authenticate with bearer token. Give either with initial 'Bearer ' or without it.
 * @type {request}
 * @private
 */


var _request = require('request');
var block = require('./block')
var ReturnError = require('../blocks').ReturnError

class request extends block {
    run(settings, state, callback) {

        let options = {};

        if (settings.bearer) options.auth = {bearer: settings.bearer.substring(0, 7) === "Bearer " ? settings.bearer.substring(7) : settings.bearer}

        const method = settings.method || "get";

        let url = settings.url;

        if (settings.path && typeof settings.path === "object")
            url += settings.path.join("/")
        else if (settings.path)
            url += settings.path

        if (settings.data && method !== "get") {
            options.body = JSON.stringify(settings.data)
        }
        else if (settings.data && method === "get") {
            let queryArr = [];
            for (const key in settings.data) queryArr.push(key + "=" +settings.data[key]);
            url += "?" + queryArr.join("&");
        }

        if (settings.formData) {
            options.formData = settings.formData
        }

        const tryToParse = this.tryToParse;

        if (settings.dump)
            console.log("request", url, options)

        if (method !== "get") options.method = method;

        this.capsuleAPIcall(_request, [url, options], function (error, response, body) {
            if (settings.dump)
                console.log("response", body)
            if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
                callback(null, tryToParse(body));
            }
            else if (!error && body)
                callback(new ReturnError(tryToParse(body), response.statusCode));
            else
                callback(new Error(error ? error : response))
        });
    }

    tryToParse(str) {

        if (typeof str === "object") return str;

        try {
            const json = JSON.parse(str);
            return json;
        }
        catch (e) {
            return str;
        }
    }
}


module.exports = request;