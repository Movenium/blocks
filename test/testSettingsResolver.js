var assert = require('assert');
var blocks = require("../blocks")

var mockRecorder = require("../mocker")
var md5 = require('md5')


describe("errors", function() {

    it("simple error", function(done) {
        (new blocks(undefined, {})).run([
                {wait: 10},
                {error: {
                    wait: "$wait"
                    }}
            ]).then((response) => {

        }).catch((reason) => {
            assert.equal(reason.message, "error thrown by error block")
            done()
        });
    })

    it("async error", function(done) {
        (new blocks(undefined, {})).run([
            {wait: 10},
            {error: {
                        message: "yaml crashed",
                        promise: true,
                        wait: "$wait"
                    }},
            {data: {wait: "$error", message: "something"}}
        ]).then((response) => {

        }).catch((reason) => {
            assert.equal(reason.message, "rejected by error block")
            done()
        });
    })

    it("error inside yaml", function(done) {
        (new blocks(undefined, {})).run("test/testyaml.yml").catch((reason) => {
            assert.equal(reason.message, "rejected by error block")
            done()
        });
    })

})

describe('async', function() {

    let mocker = new mockRecorder("mock", {debug: null})

    it("simple request test", function(done) {

        (new blocks(undefined, {test1: 1, test2: 2}, null, mocker)).run([{request: {url: "http://localhost:30003/trigger/hook"}}]).then((response) => {
            assert.equal(response.statusCode, 200);
            assert.equal(response.body, '[{"a":"1","b":"2"}]');
            done();
        });
    })

    it("request block parses json responses", function(done) {
        const expectedBody = {foo: "bar"}
        const normalizedOptions = {
            url: "https://example.org/api",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(expectedBody),
            method: "POST"
        }

        const jsonMocker = new mockRecorder("mock", {type: "collect", recordings: [{
            key: md5(JSON.stringify([normalizedOptions])),
            params: [normalizedOptions],
            response: [null, {statusCode: 200, headers: {'content-type': 'application/json; charset=utf-8'}}, '{"ok":true}']
        }]});

        (new blocks(undefined, {}, null, jsonMocker)).run([{request: {url: normalizedOptions.url, method: normalizedOptions.method, body: expectedBody}}]).then((response) => {
            assert.equal(response.statusCode, 200)
            assert.deepEqual(response.json, {ok: true})
            assert.equal(response.body, '{"ok":true}')
            done()
        }).catch(done)
    })

    //mocker.mode = "record"

    it("mongoose test get", function(done) {

        (new blocks(undefined, {}, null, mocker)).run([{
            mongoose: {
                clearModels: true,
                schema: {teste: "string"},
                url: "mongodb://localhost:27017/docker_dev",
                collection: "test",
                lean: true,
                find: {}
            }
        }]).then((response) => {
            assert.equal(response.length, 1);
            assert.equal(response[0].test, "works");
            done();
        });
    })

    it("mongoose test write", function(done) {

        (new blocks(undefined, {}, null, mocker)).run([{
            mongoose: {
                clearModels: true,
                schema: {testwrite: "string"},
                url: "mongodb://localhost:27017/docker_dev",
                collection: "testwrite",
                create: {"testwrite": "ok"}
            }
        }]).then((response) => {
            assert.equal(response.testwrite, "ok");
            done();
        });
    })

    it("test response block", function(done) {

        (new blocks(undefined)).run([{
            data: {
                works: "like a charm"
            }
        }, {
            response: {
            message: "$data"
        }
        }]).then((response) => {
            assert.equal(response.statusCode, 200);
            assert.equal(response.body, '{"message":{"works":"like a charm"}}');
            done();
        });

    })

})

describe('Settings', function() {

    it('test easiest setting', function(done) {
        (new blocks(undefined, {test1: 1, test2: 2})).run([{data: 1}]).then((response) => {
            assert.equal(response, 1);
            done();
        });
    });

    it('test fetching from state', function(done) {
        (new blocks(undefined, {test1: 1, test2: 2})).run([{data: "$test2"}]).then((response) => {
            assert.equal(response, 2);
            done();
        });
    });

    it('test fetching from state sub object', function(done) {
        (new blocks(undefined, {test1: 1, test2: {first: 11, second: 22}})).run([{data: "$test2.first"}]).then((response) => {
            assert.equal(response, 11);
            done();
        });
    });

    it('test resolvable settings', function(done) {
        (new blocks(undefined, {test1: 1, test2: {first: 11, second: 22}})).run([{data: {"$test": {resolvethis: "$test2.first"}}}]).then((response) => {
            assert.equal(response.test.resolvethis, 11);
            done();
        });
    });

    it('test yaml', function(done) {
        (new blocks()).run("test/tests.yml").then((response) => {
            assert(response)
            //console.log("resp", response.testarray)
            done();
        }).catch((error) => {
            assert(false, error)

        });
    });

    it('test async yaml', function(done) {
        (new blocks()).run("test/asynctest.yml").then((response) => {
            assert(response)
            //console.log("resp", response.testarray)
            done();
        }).catch((error) => {
            assert(false, error)

        });
    });

});