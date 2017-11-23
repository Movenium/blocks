# Install

npm install blocks --save

# Usage with serverless.com

## Basic handler.js

```
var blocks = require("@vvsalmin/blocks")

module.exports.hello = (event, context, callback) => {

    blocks.run("<nameOfTheScript>.yml",{event: event}, (error, response) => {
        if (error)
            blocks.run(["consolelog", "restResponse"], {default: error}, callback);
        else
            callback(error, response);
    });
};

```

## Extending block

```
'use strict';
var block = require('@vvsalmin/blocks').block;

class _block extends block {
    run(settings, state, callback) {
        callback(null, state.default)
    }
}

module.exports = _block;
``` 

## Changes to serverless.yml

```
events:
    - http:
        path: /{dummy}
        method: any
```


# Testing

Install mocha and remember to update script test handler to package.json

```
"scripts": {
  "test": "mocha"
},
```

Pre-written mocha test handler

## Pre-written test/test.js

```
var assert = require('assert');
const fs = require('fs');
const blocks = require('blocks');

describe('Test through all yml and json tests', function() {
    fs.readdirSync("./test").forEach(file => {
        if (file.match(/.(yml|json)$/g)) {
            describe('Test ' + file, function () {
                it('Should run without errors', function(done) {
                    blocks.run((file.match(/.(json)$/g) ? './' : '../../') + 'test/' + file, {_testmode: true}, (error, response) => {
                        if (error)
                            done(error);
                        else
                            done();
                    });
                });
            });
        }
    });
});
```

test by running
```
npm test
```