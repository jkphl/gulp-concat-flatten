'use strict';

var array = require('stream-array');
var File = require('vinyl');
var path = require('path');

module.exports = function () {
    var args = Array.prototype.slice.call(arguments);
    var i = 0;
    var fn = function () {
        return 'file' + (i++).toString() + '.txt';
    };
    if (args.length && (typeof args[0] === 'function')) {
        fn = args.shift();
    }
    var fixtures = path.join(__dirname, 'fixtures');

    function create(contents) {
        return new File({
            cwd: fixtures,
            base: fixtures,
            path: fixtures + '/' + fn(),
            contents: new Buffer(contents),
            stat: {mode: parseInt('0666', 8)}
        });
    }

    return array(args.map(create));
};
