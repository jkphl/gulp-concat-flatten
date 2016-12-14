'use strict';

var through = require('through2');
var path = require('path');
var fs = require('fs');
var File = require('vinyl');
var Concat = require('concat-with-sourcemaps');
var cloneStats = require('clone-stats');
var glob = require('glob');

/**
 * Concatenation by directory structure
 *
 * The method will concatenate files based on their position in the file system. It does only process files that are
 * stored in or below the given base directory (positions beyond will be ignored). Files directly stored in the base
 * directory will just be copied to the destination. Files in subdirectories will be concatenated to resources named
 * after the first-level subdirectory (with an optional file extension).
 *
 * @param {String} base Base directory
 * @param {String} ext File extension
 * @param {Object} opt Options
 * @returns {*}
 */
module.exports = function (base, ext, opt) {

    // Error if the base directory is missing
    if (!base) {
        throw new Error('gulp-concat-flatten: Missing base directory');
    }

    // Error if the base directory isn't a string
    if (typeof base !== 'string') {
        throw new Error('gulp-concat-flatten: Base directory must be a directory path');
    }

    // Error if the base directory doesn't exist
    base = path.resolve(base) + '/';
    try {
        var baseDirs = glob.sync(base, {mark: true});
        if (!baseDirs.length) {
            throw 'error';
        }
    } catch (e) {
        throw new Error('gulp-concat-flatten: No matching base directory exists');
    }

    ext = ('' + (ext || '')).trim();
    if (ext.length && (ext.substr(0, 1) !== '.')) {
        ext = '.' + ext;
    }
    opt = opt || {};

    // to preserve existing |undefined| behaviour and to introduce |newLine: ""| for binaries
    if (typeof opt.newLine !== 'string') {
        opt.newLine = '\n';
    }

    var isUsingSourceMaps = false;
    var latestFile;
    var latestMod;
    var concats = [];

    /**
     * Buffer incoming contents
     *
     * @param {File} file File
     * @param enc
     * @param {Function} cb Callback
     */
    function bufferContents(file, enc, cb) {

        // Ignore empty files
        if (file.isNull()) {
            cb();
            return;
        }

        // We don't do streams (yet)
        if (file.isStream()) {
            this.emit('error', new Error('gulp-concat-flatten: Streaming not supported'));
            cb();
            return;
        }

        // Enable sourcemap support for concat if a sourcemap initialized file comes in
        if (file.sourceMap && (isUsingSourceMaps === false)) {
            isUsingSourceMaps = true;
        }

        // Set latest file if not already set, or if the current file was modified more recently.
        if (!latestMod || (file.stat && (file.stat.mtime > latestMod))) {
            latestFile = file;
            latestMod = file.stat && file.stat.mtime;
        }

        // Extract the target file basename
        var targetRelative;
        for (var b = 0; b < baseDirs.length; ++b) {
            if (file.path.indexOf(baseDirs[b]) === 0) {
                targetRelative = path.relative(baseDirs[b], file.path);
                break;
            }
        }
        var targetBase = (targetRelative.indexOf(path.sep) >= 0) ?
            (targetRelative.split(path.sep).shift() + ext) : targetRelative;

        // Register a new concat instance if necessary
        if (!(targetBase in concats)) {
            concats[targetBase] = {concat: new Concat(isUsingSourceMaps, targetBase, opt.newLine)};
        }

        // Add file to the concat instance
        concats[targetBase].stats = cloneStats(file.stat);
        concats[targetBase].concat.add(file.relative, file.contents, file.sourceMap);
        cb();
    }

    /**
     * End the stream
     *
     * @param {Function} cb Callback
     */
    function endStream(cb) {

        // If no files were passed in, no files go out ...
        if (!latestFile || (Object.keys(concats).length === 0 && concats.constructor === Object)) {
            cb();
            return;
        }

        // Run through all registered contact instances
        for (var targetBase in concats) {
            var joinedFile = new File({
                path: targetBase,
                contents: concats[targetBase].concat.content,
                stat: concats[targetBase].stats
            });
            if (concats[targetBase].concat.sourceMapping) {
                joinedFile.sourceMap = JSON.parse(concats[targetBase].concat.sourceMap);
            }
            this.push(joinedFile);
        }
        cb();
    }

    return through.obj(bufferContents, endStream);
};
