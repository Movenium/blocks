'use strict';
var block = require('./block');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var yaml = require('node-yaml');

class _block extends block {
    run() {
        return new Promise((resolve,reject) => {
            mongoose.connect(this.get("url"), (err) => {
                //reject(err)
            });

            var db = mongoose.connection;
            db.on('error', (err) => reject(err))
            db.once('open', () => {
                // we're connected!
                if (this.exists("schema"))
                    this.createSchema(this.get("collection"), this.get("schema"))
                else if (this.exists("schemas"))
                    this.createSchemas(this.get("schemas"))

                const action = this.getAction()

                if (action) {

                    var model = mongoose.model(this.get("collection"));

                    model[action](this.get(action), (err, result) => {
                        if (err) return reject(err)
                        resolve(result);
                    })
                }
                else
                    resolve()
            });
        })
    }

    getAction() {
        const actions = ["find", "create", "insertMany"]

        let foundAction = null

        actions.forEach((action) => {
            if (this.exists(action)) foundAction = action
        })

        return foundAction
    }

    createSchemas(filename) {
        const schemas = yaml.readSync("../" + filename, {encoding: "utf8", schema: yaml.schema.defaultSafe})

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


        mongoose.model(collectionName, new Schema(schema))//, { collection: collectionName}))
    }

    getSchemaObject(str) {
        if      (str == "date")   return Date
        else if (str == "array")  return Array
        else                      return String
    }
}

module.exports = _block;