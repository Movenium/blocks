var assert = require('assert');
const fs = require('fs');
const blocks = require('../blocks');

describe('Test through all yml and json tests', function() {

    fs.readdirSync("./test").forEach(file => {

        if (file.match(/.(yml|json)$/g)) {

            describe('Test ' + file, function () {

                it('Should run without errors', function(done) {
                    blocks.run('./test/' + file, {_testmode: true}, (error, response) => {
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