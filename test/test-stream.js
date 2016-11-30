'use strict';

var array = require('stream-array');
var File = require('vinyl');

module.exports = function () {
	var args = Array.prototype.slice.call(arguments);

	var i = 0;

	function create(contents) {
		return new File({
			cwd: '/home/jkphl/',
			base: '/home/jkphl/test',
			path: '/home/jkphl/test/file' + (i++).toString() + '.js',
			contents: new Buffer(contents),
			stat: {mode: parseInt('0666', 8)}
		});
	}

	return array(args.map(create));
};
