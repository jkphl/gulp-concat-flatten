'use strict';

var through = require('through2');
var path = require('path');
var File = require('vinyl');
var Concat = require('concat-with-sourcemaps');

// file can be a vinyl file object or a string
// when a string it will construct a new one
module.exports = function (file, opt) {
	if (!file) {
		throw new Error('gulp-concat-flatten: Missing file option');
	}
	opt = opt || {};

	// to preserve existing |undefined| behaviour and to introduce |newLine: ""| for binaries
	if (typeof opt.newLine !== 'string') {
		opt.newLine = '\n';
	}

	var isUsingSourceMaps = false;
	var latestFile;
	var latestMod;
	var extName;
	var concat;
	var concats = [];

	if (typeof file === 'string') {
		extName = file;
	} else if (typeof file.path === 'string') {
		extName = path.basename(file.path);
	} else {
		throw new Error('gulp-concat-flatten: Missing path in file options');
	}

	function bufferContents(file, enc, cb) {

		// ignore empty files
		if (file.isNull()) {
			cb();
			return;
		}

		// we don't do streams (yet)
		if (file.isStream()) {
			this.emit('error', new Error('gulp-concat-flatten: Streaming not supported'));
			cb();
			return;
		}

		// enable sourcemap support for concat
		// if a sourcemap initialized file comes in
		if (file.sourceMap && isUsingSourceMaps === false) {
			isUsingSourceMaps = true;
		}

		// set latest file if not already set,
		// or if the current file was modified more recently.
		if (!latestMod || file.stat && file.stat.mtime > latestMod) {
			latestFile = file;
			latestMod = file.stat && file.stat.mtime;
		}

		// Extract the target file basename
		var targetBase = (file.relative.indexOf(path.sep) > 0) ? file.relative.split(path.sep).shift() : path.basename(file.relative, path.extname(file.relative));

		if (!(targetBase in concats)) {
			concats[targetBase] = new Concat(isUsingSourceMaps, targetBase + '.' + extName, opt.newLine);
		}

		// add file to concat instance
		concats[targetBase].add(file.relative, file.contents, file.sourceMap);
		cb();
	}

	function endStream(cb) {

		// no files passed in, no file goes out
		if (!latestFile || (Object.keys(concats).length === 0 && concats.constructor === Object)) {
			cb();
			return;
		}

		for (var targetBase in concats) {
			var joinedFile = new File();
			joinedFile.contents = concats[targetBase].content;
			if (concats[targetBase].sourceMapping) {
				joinedFile.sourceMap = JSON.parse(concats[targetBase].sourceMap);
			}
			this.push(joinedFile);
		}
		cb();
		return;

		var joinedFile;

		// if file opt was a file path
		// clone everything from the latest file
		if (typeof file === 'string') {
			joinedFile = latestFile.clone({contents: false});
			joinedFile.path = path.join(latestFile.base, file);
		} else {
			joinedFile = new File(file);
		}

		joinedFile.contents = concat.content;

		if (concat.sourceMapping) {
			joinedFile.sourceMap = JSON.parse(concat.sourceMap);
		}

		this.push(joinedFile);
		cb();
	}

	return through.obj(bufferContents, endStream);
};
