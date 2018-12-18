'use strict';
var block = require('./block');
const isYaml = require("../tools").isYaml

/**
 * EXAMPLE
 *
 * - if:
 *     test: $data
 *     equals: 10
 *     then: data is 10
 *     else: data is not 10
 *
 *   tests: equals, notequals, gt, gte, lt, lte
 *
 *  - if:
 *      not: $data
 *      then: no data
 */

class _block extends block {
    run() {
        if (this.exists("not")) {

            if (!this.get("not"))
                return this.setOrRun(this.get("then"))
        }
        else if (this.test(this.get("test"))) {
            return this.setOrRun(this.get("then"))
        } else if (this.exists("else")) {
            return this.setOrRun(this.get("else"))
        }

        return null
    }

    setOrRun(value) {
        if (typeof value !== "object" && !isYaml(value))
            return value
        else
            return this.runBlockList(value)
    }

    test(value) {

        if (this.exists("equals")) {
            return this.get("equals") === value
        }
        else if (this.exists("notequals")) {
            return this.get("notequals") !== value
        }
        else if (this.exists("gt")) {
            return this.get("gt") < value
        }
        else if (this.exists("gte")) {
            return this.get("gte") <= value
        }
        else if (this.exists("lt")) {
            return this.get("lt") > value
        }
        else if (this.exists("lte")) {
            return this.get("lte") >= value
        }
        else if (this.exists("includes")) {
            return Array.isArray(value) ? value.includes(this.get("includes")) : false
        }
        else
            return value ? true : false

    }
}

module.exports = _block;