'use strict';
var block = require('./block');
var get = require('../tools').get
//var moment = require('moment')

class _block extends block {
    run() {

        const formatters = Object.keys(this.settings)

        formatters.forEach((formatter) => {
            if (formatter === "edit") return
            const key = this.settings[formatter]

            if (!key.includes(".")) {
                const object = this.get("edit")
                object[key] = this.format(formatter, object[key])
            }
            else {
                const key_arr = key.split(".")
                const last_key = key_arr.pop()
                const object = get(this.get("edit"), key_arr.join("."))

                object[last_key] = this.format(formatter, object[last_key])
            }
        })
    }

    format(formatter, value) {

        switch (formatter) {
            case "toString": return value.toString()
            case "singularify": return value.endsWith("s") ? value.substring(0, value.length - 1) : value
            case "parseInt": return parseInt(value, 10)
            case "toDate": return moment(value).toDate()
            case "toMongoDate": return {
                '$gte': moment(value).toDate(),
                '$lt': moment(value).endOf("day").toDate()
            }
            case "toMongoDateRange": return {
                '$gte': moment(value.split('_')[0]).toDate(),
                '$lt': moment(value.split('_')[1]).endOf("day").toDate()
            }
        }

    }
}

module.exports = _block;