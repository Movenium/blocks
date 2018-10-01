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

        return new Promise((resolve,reject) => {
            mongoose.connect(this.get("url"), (err) => {
                //reject(err)
            });

            var db = mongoose.connection;
            db.on('error', (err) => reject(err))
            db.once('open', () => {

                try {
                    // we're connected!
                    if (this.exists("schema"))
                        this.createSchema(this.get("collection"), this.get("schema"))
                    else if (this.exists("schemas"))
                        this.createSchemas(this.get("schemas"))

                    const action = this.getAction()

                    if (action) {

                        var model = mongoose.model(this.get("collection"));

                        if (this.get("lean", false) && ["find", "findOne"].includes(action)) {
                            model[action](this.get(action)).lean().exec((err, result) => {
                                if (err) return reject(err)
                                resolve(result);
                            })
                        } else {
                            // args must be array for mongoose .. if object given put it inside an array
                            const args = Array.isArray(this.get(action)) ? this.get(action) : [this.get(action)]
                            args.push((err, result) => {
                                if (err) return reject(err)

                                if (this.get("lean", false))
                                    resolve(result.toObject())
                                else
                                    resolve(result)
                            })
                            model[action](...args)
                        }

                    }
                    else
                        resolve()
                }
                catch (e) {
                    reject(e)
                }
            });
        })
    }

    getAction() {
        const actions = ["find", "findOne", "create", "insertMany", "deleteOne", "update", "updateOne", "findByIdAndUpdate", "findOneAndUpdate"]

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
        else if (str == "objectid") return Schema.Types.ObjectId
        else if (str == "mixed")    return Schema.Types.Mixed
        else                        return String
    }
}

module.exports = _block;