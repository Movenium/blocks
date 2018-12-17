'use strict';
var block = require('./block');
var request = require('request');

class _block extends block {
    run() {
        return new Promise((resolve, reject) => {

            let headers = {}
            if (this.exists("bearer")) headers.Authorization = this.get("bearer")

            var options = {
                url: this.get("url"),// + this.exists("path") ? this.get("path", "") : "",
                headers: headers
            };

            if (this.exists("body")) options["body"] = this.get("body")
            if (this.exists("method")) options["method"] = this.get("method")

            this.mocker.mockFunction(request, options, (error, response, body) => {
                if (error) return reject(error)
                if (!response) return reject("noresponse")
                if (response.statusCode != 200 && response.statusCode != 201) return reject(body)

                let ret = {
                    statusCode: response.statusCode,
                    body: body,
                    headers: response.headers
                }
                if (response.headers['content-type'] === "application/json")
                    ret.json = JSON.parse(body);

                resolve(ret)

            });
        })

    }
}

module.exports = _block;