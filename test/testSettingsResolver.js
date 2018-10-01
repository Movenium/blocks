var assert = require('assert');
var blocks = require("../blocks")

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

});