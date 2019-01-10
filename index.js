'use strict';

const through = require('through2');
const path = require('path');
const fs = require('fs');
const File = require('vinyl');
const Concat = require('concat-with-sourcemaps');
const cloneStats = require('clone-stats');
const glob = require('glob');
const minimatch = require('minimatch');
const toposort = require('toposort');

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
    let baseDirs;
    base = path.resolve(base) + '/';
    try {
        baseDirs = glob.sync(base, { mark: true });
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

    let isUsingSourceMaps = false;
    let latestFile;
    let latestMod;
    const concats = [];
    const dependencies = {};
    const nameBaseMap = {};
    let dependencyGraph = [];

    /**
     * Buffer incoming contents
     *
     * @param {File} file File
     * @param enc
     * @param {Function} cb Callback
     */
    function bufferContents(file, enc, cb) {

        // Ignore empty files & dependency descriptors
        if (file.isNull() || (file.basename === '.dependencies.json')) {
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
        let targetRelative;
        let targetPath;
        let targetBase;
        let targetDeep = false;
        let targetExt;
        for (let b = 0; b < baseDirs.length; ++b) {
            if (file.path.indexOf(baseDirs[b]) === 0) {
                targetRelative = path.relative(baseDirs[b], file.path);
                targetPath = path.relative(file.cwd, baseDirs[b]);
                break;
            }
        }
        if (targetRelative.indexOf(path.sep) >= 0) {
            targetBase = targetRelative.split(path.sep).shift() + ext;
            targetExt = ext;
            targetDeep = true;
        } else {
            targetBase = targetRelative;
            targetExt = path.extname(targetBase);
        }
        if (targetPath.length) {
            targetBase = path.join(targetPath, targetBase);
        }

        // Create a resource "name" (without file extension)
        const targetName = path.join(path.dirname(targetBase), path.basename(targetBase, targetExt));
        nameBaseMap[targetBase] = targetBase;

        if (targetDeep && !(targetName in dependencies)) {
            nameBaseMap[targetName] = targetBase;
            dependencies[targetName] = {};
            let dependencyDirectory = path.resolve(file.base, path.relative(targetPath, targetName));
            while (dependencyDirectory.length && (dependencyDirectory !== __dirname) && (dependencyDirectory !== '.')) {
                try {
                    dependencies[targetName] = require(path.resolve(dependencyDirectory, '.dependencies.json'));
                    for (let pattern in dependencies[targetName]) {
                        if (minimatch.match([path.basename(targetBase)], pattern).length) {
                            dependencies[targetName][pattern].forEach((dependency) => {
                                dependencyGraph.push([targetBase, dependency]);
                            });
                            break;
                        }
                    }
                } catch (e) {
                    // Skip
                }
                dependencyDirectory = path.dirname(dependencyDirectory);
            }
        }

        // Register a new concat instance if necessary
        if (!(targetBase in concats)) {
            concats[targetBase] = { concat: new Concat(isUsingSourceMaps, targetBase, opt.newLine) };
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

        // Prepare a method for pushing the stream
        const pushJoinedFile = (joinedBase) => {
            const joinedFile = new File({
                path: joinedBase,
                contents: concats[joinedBase].concat.content,
                stat: concats[joinedBase].stats
            });
            if (concats[joinedBase].concat.sourceMapping) {
                joinedFile.sourceMap = JSON.parse(concats[joinedBase].concat.sourceMap);
            }
            this.push(joinedFile);
            delete concats[joinedBase];
        };

        // Refine the dependency graph
        const refinedDependencyMap = [];
        dependencyGraph.forEach(edge => {
            if ((edge[0] in nameBaseMap) && (edge[1] in nameBaseMap)) {
                refinedDependencyMap.push([nameBaseMap[edge[0]], nameBaseMap[edge[1]]]);
            }
        });
        const sortedDependencies = refinedDependencyMap.length ? toposort(refinedDependencyMap).reverse() : [];
        sortedDependencies.map(pushJoinedFile);

        // Run through all registered contact instances
        for (const targetBase in concats) {
            pushJoinedFile(targetBase);
        }
        cb();
    }

    return through.obj(bufferContents, endStream);
};
