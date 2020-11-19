'use strict';
var block = require('./block');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var yaml = require('node-yaml');
const isYaml = require("../tools").isYaml
var version = require('mongoose-version');

/**
 * EXAMPLE
 *
 * - mongoose:
 *     url: $values.config.mongourl
 *     collection: $queryParams.form
 *     $updateOne:
 *        - _id: $queryParams.id
 *          _partnerid: $values.userProfile.partnerid
 *        - \$set: $document
 *
 */

class _block extends block {
    run() {

        if (this.get("clearModels", false)) {
            mongoose.models = {};
            mongoose.modelSchemas = {};
        }

        // if block is only used for schema creation
        if (!this.exists("url") && (this.exists("schema") || this.exists("schemas"))) return this.createAllSchemas()

        return this.mocker.newPromise((resolve,reject) => {
            this.createAllSchemas()
            mongoose.connect(this.get("url"), { useNewUrlParser: true }).then(() => {
                this.makeMongooseQuery(mongoose.connection, resolve, reject)
            }, (err) => {
                reject(err)
            });
        }, this.settings)
    }

    createAllSchemas() {
        if (this.exists("schema"))
            this.createSchema(this.get("collection"), this.get("schema"))
        else if (this.exists("schemas"))
            this.createSchemas(this.get("schemas"))
    }

    makeMongooseQuery(db, resolve, reject) {
        try {
            // we're connected!
            const action = this.getAction()

            if (action) {

                var model = mongoose.model(this.get("collection"));
                var actionParams = this.get(action)

                if (action == "find" && Array.isArray(actionParams)) {
                    this.queryBuilder(model, actionParams, (err, result) => {
                        if (err) return reject(err)
                        db.close()
                        resolve(result);
                    })
                }
                else if (this.get("lean", false) && ["find", "findOne"].includes(action)) {
                    //model[action](this.get(action)).lean().exec((err, result) => {
                    this.runQueryAndLean(model, action, this.get(action), (err, result) => {
                        if (err) return reject(err)
                        db.close()
                        resolve(result);
                    })
                } else {
                    // args must be array for mongoose .. if object given put it inside an array
                    const args = Array.isArray(this.get(action)) && action !== "aggregate" ? this.get(action) : [this.get(action)]
                    this.runQuery(model, action, args, (err, result) => {
                        if (err) return reject(err)
                        db.close()

                        if (this.get("lean", false))
                            resolve(result.toObject())
                        else
                            resolve(result)
                    })
                }

            }
            else
                resolve()
        }
        catch (e) {
            reject(e)
        }
    }

    runQueryAndLean(model, action, params, callback) {
        model[action](params).lean().exec(callback)
    }

    runQuery(model, action, params, callback) {
        model[action](...params, callback)
    }

    queryBuilder(model, params, callback) {
        let loop = model.find()
        params.forEach((item) => {
            const keys = Object.keys(item)
            const func = keys[0]
            const param = item[func]
            loop = param ? loop[func](param) : loop[func]()
        })
        if (this.get("lean")) loop = loop.lean()
        loop.exec(callback)
    }

    getAction() {
        const actions = ["find", "findOne", "create", "insertMany", "deleteOne", "deleteMany", "update", "updateOne", "findByIdAndUpdate", "findOneAndUpdate", "aggregate"]

        let foundAction = null

        actions.forEach((action) => {
            if (this.exists(action)) foundAction = action
        })

        return foundAction
    }

    createSchemas(mixed) {

        let schemas

        if (isYaml(mixed))
            schemas = yaml.readSync(this.blocks.rootdir + mixed, {encoding: "utf8", schema: yaml.schema.defaultSafe})
        else
            schemas = mixed

        for (let collection of Object.keys(schemas))
            this.createSchema(collection, schemas[collection])
    }

    createSchema(collectionName, schemaArr) {
        if (!schemaArr) return
        const fields = Object.keys(schemaArr)
        const schema = {}

        fields.forEach((fieldName) => {
            const field = schemaArr[fieldName]

            if (typeof field === "object") {
                field.type = this.getSchemaObject(field.type)
                schema[fieldName] = field
            }
            else
                schema[fieldName] = this.getSchemaObject(field)
        })

        const mongooseSchema =  new Schema(schema, { collection: collectionName})
        if (this.get("versions", false)) mongooseSchema.plugin(version, { collection: "_history_" + collectionName})
        mongoose.model(collectionName, mongooseSchema)
    }

    getSchemaObject(str) {
        if      (str == "date")     return Date
        else if (str == "array")    return Array
        else if (str == "number")   return Number
        else if (str == "[number]") return [Number]
        else if (str == "objectid") return Schema.Types.ObjectId
        else if (str == "mixed")    return Schema.Types.Mixed
        else if (str == "[string]") return [String]
        else                        return String
    }
}

module.exports = _block;