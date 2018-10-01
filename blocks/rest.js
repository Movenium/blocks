'use strict';
var block = require('./block')
var tools = require('../tools')

class _block extends block {
    run() {

        const event = this.get("event")

        if (!this.exists("routes")) throw new Error("Routes must be given")

        for (const route of this.get("routes")) {
            if (!route.method) throw new Error("routes must have methods");

            const isThisRoute = this.isThisRoute(route, event);
            if (isThisRoute) {
                return this.runBlockList(route.run, isThisRoute)
            }
        }

        throw new Error("Route wasn't found");
    }

    isThisRoute(route, event) {

        if (!event) return false;

        if (route.method === "crud") {
            const values_without_id = this.testPath(route.path, event);

            if (values_without_id && event.httpMethod.toLowerCase() == "post") {
                return {action: "insert", queryParams: values_without_id};
            }
            if (values_without_id && event.httpMethod.toLowerCase() == "get") {
                return {action: "findAll", queryParams: values_without_id};
            }

            const values_with_id = this.testPath(route.path + "/:id", event);

            if (values_with_id && event.httpMethod.toLowerCase() == "put") {
                return {action: "update", queryParams: values_with_id};
            }
            if (values_with_id && event.httpMethod.toLowerCase() == "get") {
                return {action: "read", queryParams: values_with_id};
            }
            if (values_with_id && event.httpMethod.toLowerCase() == "delete") {
                return {action: "delete", queryParams: values_with_id};
            }
        }
        else {
            if (event.httpMethod.toLowerCase() !== route.method.toLowerCase()) return false;
            const values = this.testPath(route.path, event);
            if (!values) return false;
            return {queryParams: values};
        }

        return false;
    }

    testPath(path, event) {
        const parsedPath = this.makeRegexpFromPath(path);

        const match = event.path.match(parsedPath.regexp);

        if (match === null) return false;

        let values = {};

        for (const index in parsedPath.keys) {
            const key = parsedPath.keys[index];
            values[key] = match[parseInt(index) + 1];
        }

        return values;
    }

    makeRegexpFromPath(path) {

        let temp = '^';
        let keys = [];

        for (const sub of this.removeFirstSlash(path).split("/")) {
            temp += '\\/';
            if (sub.substring(0, 1) === ":") {
                keys.push(sub.substring(1));
                temp += '([^/]+)';
            }
            else
                temp += sub;
        }

        temp += '$';

        return {regexp: new RegExp(temp), keys: keys};
    }

    removeFirstSlash(str) {
        if (str.substring(0, 1) === "/") return str.substring(1);
        return str;
    }
}


module.exports = _block;
