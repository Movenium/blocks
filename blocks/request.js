'use strict';
var block = require('./block');

const fetchImpl = typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null;

function hasContentType(headers) {
    return Object.keys(headers).some((key) => key.toLowerCase() === "content-type")
}

function normalizeOptions(options) {
    const normalized = {
        ...options,
        headers: {...(options.headers || {})}
    }

    if (typeof normalized.body !== "undefined" && normalized.body !== null) {
        if (typeof normalized.body === "object" && !Buffer.isBuffer(normalized.body) && !ArrayBuffer.isView(normalized.body)) {
            normalized.body = JSON.stringify(normalized.body)
            if (!hasContentType(normalized.headers)) normalized.headers['content-type'] = "application/json"
        }
    }

    return normalized
}

function executeRequest(options, callback) {
    if (!fetchImpl) return callback(new Error("Global fetch API is not available"));

    const init = {
        method: options.method || "GET",
        headers: {...(options.headers || {})}
    };

    if (typeof options.body !== "undefined") init.body = options.body;

    fetchImpl(options.url, init).then(async (response) => {
        const responseBody = await response.text();
        const headersObj = {};
        response.headers.forEach((value, key) => {
            headersObj[key] = value;
        });
        callback(null, {
            statusCode: response.status,
            headers: headersObj
        }, responseBody);
    }).catch((error) => callback(error));
}

class _block extends block {
    run() {
        return new Promise((resolve, reject) => {

            let headers = {...(this.get("headers", {}) || {})}
            if (this.exists("bearer")) headers.Authorization = this.get("bearer")

            var options = {
                url: this.get("url"),// + this.exists("path") ? this.get("path", "") : "",
                headers: headers
            };

            if (this.exists("body")) options["body"] = this.get("body")
            if (this.exists("method")) options["method"] = this.get("method")

            const normalizedOptions = normalizeOptions(options)

            this.mocker.mockFunction(executeRequest, normalizedOptions, (error, response, body) => {
                if (error) return reject(error)
                if (!response) return reject("noresponse")
                if (response.statusCode != 200 && response.statusCode != 201) return reject(body)

                let ret = {
                    statusCode: response.statusCode,
                    body: body,
                    headers: response.headers
                }
                const contentType = response.headers && response.headers['content-type'] ? response.headers['content-type'] : ""
                if (contentType && contentType.toLowerCase().includes("application/json"))
                    ret.json = body ? JSON.parse(body) : null;

                resolve(ret)

            });
        })

    }
}

module.exports = _block;