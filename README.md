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

## Registry access

The package is published to GitHub Packages, not to npmjs.com. Installing it needs a GitHub token with the `read:packages` scope.

In the consuming repository, commit this line in `.npmrc` so `@movenium/*` packages resolve from GitHub Packages:

```
@movenium:registry=https://npm.pkg.github.com
```

Do not commit the token. On your machine, log in once with a classic personal access token that has `read:packages`:

```
npm login --scope=@movenium --auth-type=legacy --registry=https://npm.pkg.github.com
```

In GitHub Actions, pass `registry-url: 'https://npm.pkg.github.com'` and `scope: '@movenium'` to `actions/setup-node` and set `NODE_AUTH_TOKEN: ${{ github.token }}` on the install step. The consuming repository needs Read access under the package's "Manage Actions access" settings.

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

Publishing runs in GitHub Actions (`.github/workflows/publish.yml`) when a GitHub release is published. Do not run `npm publish` from your machine.

1. Make sure you are on `master`, the working tree is clean, and the branch is up to date:
    ```
    git checkout master
    git pull --ff-only
    ```
2. Bump the version. `npm version` updates `package.json`, creates a commit and a matching `vX.Y.Z` tag:
    ```
    npm version patch    # bug/security fix
    npm version minor    # backwards-compatible feature
    npm version major    # breaking change
    ```
3. Push the commit and the tag:
    ```
    git push --follow-tags
    ```
4. Create a GitHub release from the tag. The workflow checks that the tag matches `package.json`, runs the tests and publishes the package.

For a pre-release, bump with `npm version prerelease --preid=alpha` and mark the GitHub release as a pre-release. It is published under the `alpha` dist-tag, so callers on `latest` do not pick it up. Install it with `npm install @movenium/blocks@alpha`.

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