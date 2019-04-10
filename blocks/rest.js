'use strict';
var block = require('./block')
var tools = require('../tools')

/**
 * EXAMPLE:
 * 
 *- rest:
    method: $event.httpMethod
    path: $event.path

    routes:
      - method: post
        path: /:form
        run:
          - routes/insertRow.yml:
              values: $values
              queryParams: $queryParams

      - method: patch
        path: /:form/:id
        run:
          - routes/updateRow.yml:
              values: $values
              queryParams: $queryParams
 */
class _block extends block {
    run() {
        return new Promise((resolve, reject) => {
            for (const route of this.get("routes")) {
                if (!route.method) route.method = "get"

                const isThisRoute = this.isThisRoute(route, this.get("method").toLowerCase(), this.get("path"));
                if (isThisRoute) {
                    this.runBlockList(route.run, isThisRoute).then((response) => {
                        resolve({response: response, params: isThisRoute})
                    }).catch(reject)
                    return
                }
            }

            reject(Error("Route wasn't found"))
        })
    }

    isThisRoute(route, method, path) {
        if (method.toLowerCase() !== route.method.toLowerCase()) return false;
        const values = this.testPath(route.path, path);
        if (!values) return false;
        return {queryParams: values};
    }

    testPath(path, testpath) {
        const parsedPath = this.makeRegexpFromPath(path);

        const match = testpath.match(parsedPath.regexp);

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
