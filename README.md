# Usage with serverless.com

## install serverless

https://serverless.com/framework/docs/getting-started/

and create new project

https://serverless.com/framework/docs/providers/aws/guide/quick-start/

# Install

init your new project with `npm init`

install blocks `npm install @movenium/blocks --save`

## Developing

https://github.com/dherault/serverless-offline

### tl;dr
`npm install serverless-offline --save-dev`

#### Changes to serverless.yml

modify events (and uncomment)
```
events:
    - http:
        path: /{dummy}
        method: any
```

add to end of the file
```
plugins:
  - serverless-offline
``` 

use by typing `serverless offline start`

## Basic handler.js

```
'use strict';

var blocks = require("@movenium/blocks/blocks");
var logger = require("@movenium/blocks/logger");

module.exports.hello = (event, context, callback) => {
    const _logger = new logger();
    
    (new blocks(_logger)).run("server2.yml", {event: event}).then((response) => {
        callback(null, response);
    }, (reason) => {
        const response = {
            statusCode: 400,
            body: JSON.stringify({message: reason.message, meta: _logger.getLog(), stack: reason.stack}),
        };

        callback(null, response);
    })

};

```

## Extending block

```
'use strict';
var block = require('@movenium/blocks/block');

class _block extends block {
    run() {
        <your code here!>
    }
}

module.exports = _block;
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