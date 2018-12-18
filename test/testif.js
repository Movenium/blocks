var assert = require('assert');

describe("test if block", function() {

    const block = require("../blocks/if")

    it("test ok", function(done) {
        const resp = (new block(null, null, {test: true, then: "ok"})).run()
        assert.equal(resp, "ok")
        done()
    })

    it("not ok", function(done) {
        const resp = (new block(null, null, {not: false, then: "ok"})).run()
        assert.equal(resp, "ok")
        done()
    })

    it("equals ok", function(done) {
        const resp = (new block(null, null, {test: "this", equals: "this", then: "ok"})).run()
        assert.equal(resp, "ok")
        done()
    })

    it("equals fail", function(done) {
        const resp = (new block(null, null, {test: "this", equals: "notthis", then: "ok"})).run()
        assert.equal(resp, null)
        done()
    })

    it("notequals ok", function(done) {
        const resp = (new block(null, null, {test: "this", notequals: "notthis", then: "ok"})).run()
        assert.equal(resp, "ok")
        done()
    })

    it("gt ok", function(done) {
        const resp = (new block(null, null, {test: 3, gt: 2, then: "ok"})).run()
        assert.equal(resp, "ok")
        done()
    })

    it("gte fail", function(done) {
        const resp = (new block(null, null, {test: 3, gte: 4, then: "ok"})).run()
        assert.equal(resp, null)
        done()
    })

    it("lt fail", function(done) {
        const resp = (new block(null, null, {test: 3, lt: 2, then: "ok", else: "fail"})).run()
        assert.equal(resp, "fail")
        done()
    })

    it("lte ok", function(done) {
        const resp = (new block({}, null, {test: 3, lte: 3, then: [{data: "ok"}]})).run()
        resp.then((resolved) => {
            assert.equal(resolved, "ok")
            done()
        })
    })

    it("includes ok", function(done) {
        const resp = (new block(null, null, {test: [1,2,3], includes: 2, then: "ok"})).run()
        assert.equal(resp, "ok")
        done()
    })
})