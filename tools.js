'use strict';

module.exports.get = (object, path) => {

    if (!object) return null;

    const key = path.indexOf(".") !== -1 ? path.substr(0,path.indexOf('.')) : path;
    const rest = path.indexOf(".") !== -1 ? path.substr(path.indexOf('.')+1) : null;

    //console.log("parse", path, key, rest, object)

    if (object[key] && rest !== null) {
        return this.get(object[key], rest);
    }
    else if (object[key]) {
        return object[key];
    }
    else {
        //console.log("key", key, "was null")
        return null;
    }
}
