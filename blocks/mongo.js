'use strict';

var mongodb = require('mongodb');
var block = require('./block');
var ReturnError = require('../blocks').ReturnError

class mongo extends block {
    run(settings, state, callback) {

        if (!settings.url) {
            callback(new Error("Url setting is mandatory"));
            return;
        }
        if (!settings.action && !settings.aggregate) {
            callback(new Error("Action setting is mandatory"));
            return;
        }
        if (!settings.collection) {
            callback(new Error("Collection setting is mandatory"));
            return;
        }

        let document;
        if (settings.action == "update" && settings.set)
            document = {$set: settings.set}
        else
            document = settings.document;

        if (typeof document === "string") {
            document = JSON.parse(document);
        }

        if (settings.aggregate) {
            this.query(settings.url, settings.collection, {aggregate: settings.aggregate}, callback);
            return;
        }

        switch (settings.action) {
            case "insert": this.insert(settings.url, settings.collection, document, false, callback); break;
            case "insertMany": this.insert(settings.url, settings.collection, document, true, callback); break;
            case "update": this.update(settings.url, settings.collection, settings.id, document, callback); break;
            case "delete": this.delete(settings.url, settings.collection, settings.id, callback); break;
            case "read": case "find": this.read(settings.url, settings.collection, settings.id, callback); break;
            case "query": this.query(settings.url, settings.collection, settings.query, callback); break;
            default: callback(new Error("Unknown action: '" + settings.action + "'"));
        }

    }

    insert(url, collection, document, many, callback) {
        if (!document) {
            callback(new Error("Cannot insert null to mongo"));
            return;
        }

        this.capsuleAPIcall(this.mongo, [url, collection, many ? "insertMany" : "insert", null, document], (error, response) => {
            if (error)
                callback(new Error("Insert to mongo failed with response: " + error));
            else
                callback(null, response);

        });
    }

    update(url, collection, id, document, callback) {
        this.capsuleAPIcall(this.mongo, [url, collection, "update", id, document], callback);
    }

    delete(url, collection, id, callback) {
        this.capsuleAPIcall(this.mongo, [url, collection, "delete", id, null], callback);
    }

    read(url, collection, id, callback) {

        this.capsuleAPIcall(this.mongo, [url, collection, "read", id, null], (error, response) => {
            if (error)
                callback(error);
            else if (!response)
                callback(new ReturnError("Row cannot be found for _id: " + id, 404))
            else
                callback(null, response);
        });
    }

    query(url, collection, query, callback) {
        Object.keys(query).forEach((key) => {
            query[key] = this.parseSetting(query[key]);
        });

        this.capsuleAPIcall(this.mongo, [url, collection, "query", query, null], (error, response) => {
            if (error) callback(error);
            else callback(null, response);
        });
    }

    mongo(url, collection, action, idorquery, document, callback) {

        mongodb.MongoClient.connect(url, (err, db) => {

            if (err) {
                callback(err);
                return;
            }

            const _collection = db.collection(collection);

            const _callback = (...args) => {
                db.close();
                callback(...args)
            }

            const mongoquery = (collection, query, callback) => {

                let limit = 100;
                let sort = null;
                let aggregate = null;

                if (query.limit) {
                    limit = query.limit
                    delete query.limit
                }

                if (query.sort) {
                    sort = {}
                    if (query.sort.substring(0, 1) === "-") sort[query.sort.substring(1)] = -1
                    else sort[query.sort] = 1
                    delete query.sort
                }

                if (query.aggregate) {
                    aggregate = query.aggregate
                    delete query.aggregate
                }

                let cursor;

                if (aggregate)
                    cursor = collection.aggregate(aggregate);
                else {
                    cursor = collection.find(query)
                    if (sort) cursor.sort(sort);
                    cursor.limit(limit)
                }

                cursor.toArray(callback)
            }

            switch (action) {
                case "insert": _collection.insertOne( document, (error, response) => {
                    db.close();

                    if (error) callback(error)
                    else if (response.insertedCount == 1) callback(null, response.ops);
                    else callback("Insert to mongo failed. Response: " + JSON.stringify(response));

                }); break;
                case "insertMany": _collection.insertMany( document, (error, response) => {
                    db.close();

                    if (error) callback(error)
                    else if (response.insertedCount ==  document.length) callback(null, response.ops);
                    else callback("Insert to mongo failed. Response: " + JSON.stringify(response));

                }); break;

                case "update": _collection.updateOne( {_id: new mongodb.ObjectID(idorquery)}, document, _callback); break;
                case "delete": _collection.deleteOne( {_id: new mongodb.ObjectID(idorquery)}, _callback); break;
                case "read": _collection.findOne( {_id: new mongodb.ObjectID(idorquery)}, _callback); break;
                case "query": mongoquery(_collection, idorquery, _callback); break;
            }


        });
    }


}


module.exports = mongo;