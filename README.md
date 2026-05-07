# Usage with serverless.com

## Prerequisites

- Node.js LTS 24 (see `.nvmrc`).
- npm 11+.
- Serverless Framework CLI v4 (installed locally via devDependencies).

Use `nvm` (already documented in the project brief) to stay on the expected runtime:

```
nvm install 24
nvm use 24
```

## install serverless

https://serverless.com/framework/docs/getting-started/

and create new project

https://serverless.com/framework/docs/providers/aws/guide/quick-start/

### tl;dr

```
serverless create --template aws-nodejs --path my-service
npm install --save-dev serverless@^4 serverless-offline@^14
```

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

## Publishing a new version

The package is published to npm as [`@movenium/blocks`](https://www.npmjs.com/package/@movenium/blocks).

Prerequisites (one-time):

- Be a member of the `@movenium` npm org with publish rights.
- `npm login` with 2FA enabled.
- Use the Node version pinned in `.nvmrc` (`nvm use`).

Release steps:

1. Make sure you are on `master`, the working tree is clean, and the branch is up to date:
    ```
    git checkout master
    git pull --ff-only
    git status
    ```
2. Verify the build before bumping:
    ```
    npm test
    ```
3. Bump the version. `npm version` updates `package.json`, creates a commit (e.g. `2.0.20`) and a matching `vX.Y.Z` tag — matching the existing release history.
    ```
    npm version patch    # bug/security fix: 2.0.19 -> 2.0.20
    npm version minor    # backwards-compatible feature
    npm version major    # breaking change
    ```
4. Push the commit and the tag:
    ```
    git push --follow-tags
    ```
5. Publish to npm (public access is required for scoped packages):
    ```
    npm publish --access public
    ```
6. Verify the new version is live:
    ```
    npm view @movenium/blocks version
    ```

### Pre-releases (alpha / beta)

For iterative releases use the `prerelease` bump and the matching dist-tag so the new version is not picked up by callers using `latest`:

```
npm version prerelease --preid=alpha   # 2.0.20 -> 2.0.20-alpha.0
git push --follow-tags
npm publish --access public --tag alpha
```

Install a pre-release with `npm install @movenium/blocks@alpha`.

## Basic handler.js

```
'use strict';

var blocks = require("@movenium/blocks/blocks");
var logger = require("@movenium/blocks/logger");

module.exports.hello = (event, context, callback) => {
    const _logger = new logger();
    
    (new blocks(_logger)).run("server.yml", {event: event}).then((response) => {
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
var block = require('@movenium/blocks/blocks/block');

class _block extends block {
    run() {
        // <your code here!>
    }
}

module.exports = _block;
``` 

# Setting resolver

When block has settings all of them are waited and resolved before calling block's run method.

```
- data: 123
```

resolves to: `123`

```
- data: $another.something
```

resolves to: `"what ever is found from state.another.something"`
 
if state.another.something is promise it will be resolved automatically and value will be the
resolved value.

```
- data:
    test: 123
    test2: $another.something
```

resolves to: `{test: 123, test2: "what ever is found from state.another.something"}`
 
```
- data:
    test: 
      sub: $wont_be_resolved
    $test2:
      sub: $will_be_resolved
```

resolves to: `{test: {sub: "$wont_be_resolved", test2: {sub: "what ever is found from state.will_be_resolved"}}`
 
Sub settings can be resolved by adding $ in front of setting key


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
var blocks = require("@movenium/blocks/blocks")

const fs = require('fs');

describe('all recorded tests', function() {

    const rerecord = false
    const runOnly = null//['recording-get_with_bad_id']
    const skipTests = ['recording-get_with_bad_id']

    let files = fs.readdirSync("recordings").filter((item) => item.startsWith("recording-")).map((item) => item.split(".")[0])
    if (runOnly) files = files.filter((item) => runOnly.indexOf(item) !== -1)
    if (skipTests) files = files.filter((item) => skipTests.indexOf(item) === -1)
    for (let i = 0; i < files.length; i++) {

        const data = fs.readFileSync("recordings/" + files[i] + ".json", "utf8")
        const test = JSON.parse(data)

        it("run '" + files[i] + "'", function (done) {

            this.timeout(5000);

            (new blocks(undefined, null)).runMocked(test.request[0], test.request[1], files[i], test.recordings, rerecord).then((response) => {
                if (rerecord) return done()
                assert.equal(test.response[0], "resolve")
                assert.deepEqual(test.response[1], response)
                done();
            }).catch((reason) => {
                if (rerecord) return done()
                if (test.response[0] !== "reject") console.log(reason)
                assert.equal(test.response[0], "reject")
                assert.deepEqual(test.response[1], reason)
                done();
            });
        })
    }

})
```

test by running
```
npm test
```

continuous feedback while developing
```
npm run test:watch
```