'use strict';

module.exports.get = function(object, path, notFound = "null") {

    if (!object) return null;

    const key = path.indexOf(".") !== -1 ? path.substr(0, path.indexOf('.')) : path;
    const rest = path.indexOf(".") !== -1 ? path.substr(path.indexOf('.') + 1) : null;

    //console.log("parse", path, key, rest, object)

    if (object[key] && rest !== null) {

        // if path hits on promise we resolve it and continue traversing further
        if (module.exports.isPromise(object[key])) {
            return new Promise((resolve, reject) => {
                object[key].then((resolved) => {
                    resolve(module.exports.get(resolved, rest))
                }, reject)
            })
        }

        return module.exports.get(object[key], rest);
    }
    else if (object[key]) {
        return object[key];
    }
    else {
        //console.log("key", key, "was null")
        return notFound === "null" ? null : undefined
    }
}

module.exports.isPromise = function(object) {
    if (!object) return false
    if (typeof object !== "object") return false
    return typeof object.then === "function"
}

module.exports.isYaml = function(str){
    if (typeof str !== "string") return false
    return str.match(/.yml$/g) ? true : false
}