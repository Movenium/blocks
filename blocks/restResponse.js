'use strict';

/**
 * Format string, object or error to rest response format
 *
 * ie. {test: test} will output {statusCode: 200, body: {\"test\": \"test\"}
 *
 * Settings:
 *  - dumpErrors: if true also internal server errors 500 will be outputted to response. Should be used in dev envs
 *  - message: you can give output by yourself. If not given default channel is used.
 * @type {block}
 */

var block = require('./block')
var ReturnError = require('../blocks').ReturnError;

class restResponse extends block {
    run(settings, state, callback) {

        let body = settings.body || (settings.message ? {message:  settings.message} : state.default);
        let statusCode = settings.statusCode || 200;

        if (body instanceof ReturnError || ((body instanceof Error) && settings.dumpErrors)) {
            statusCode = body.errorcode || 400;

            if (body.response)
                body = body.response
            else
                body = {error: statusCode, error_description: body.message};
        }
        else if (body instanceof Error) {
            statusCode = 500;
            body = {error: "Internal Server Error"};
        }

        /*if (body instanceof BlocksError) {
            statusCode = settings.statusCode || 400;
            body = body.message
        }*/
        const response = {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
        };

        callback(null, response);
    }
}

module.exports = restResponse;
