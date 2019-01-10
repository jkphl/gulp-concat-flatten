# gulp-concat-flatten [![NPM version][npm-image]][npm-url] [![NPM downloads][npm-downloads]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url] [![Development Dependency Status][devdepstat-image]][devdepstat-url]

is a Gulp plugin that concatenates files based on their directory structure. Starting at a base directory of your choice, it recursively flattens out subdirectories and concatenates the files within these. Files in the base directory will get copied without concatenation. 

## Installation

To install `gulp-concat-flatten` as a development dependency, simply run:

```shell
npm install --save-dev gulp-concat-flatten
```

## Usage

Add it to your `gulpfile.js` and use it like this:

```javascript
const gulp      = require('gulp');
const concat    = require('gulp-concat-flatten');
const sort      = require('gulp-sort');

gulp.src('path/**/*.txt')
	.pipe(sort()) // Recommendation, see below
	.concat('path/to/assets', 'txt', {'newLine': '\n'})
	.pipe(gulp.dest('out'));
```

Running the shown task on a source file structure like this:

```
path
`-- to
    |-- 00_outside.txt
    `-- assets
        |-- 01_first.txt
        |-- 02_second
        |   |-- 01_second_first.txt
        |   |-- 02_second_second
        |   |   `-- second_second_first.txt
        |   `-- 03_second_third.txt
        `-- 03_third.txt
```

would result in:

```
out
|-- 01_first.txt
|-- 02_second.txt
`-- 03_third.txt
```

In detail,

* the file `path/to/00_outside.txt` would be skipped as it's not contained in the base directory `path/to/assets`,
* the files `path/to/assets/01_first.txt` and `path/to/assets/03_third.txt` would be copied over without concatenation,
* the directory `path/to/assets/02_second` would be recursively concatenated and appended with the file extension `".txt"`.

Generally, I recommend sorting the source files via [gulp-sort](https://github.com/pgilad/gulp-sort) prior to piping them through `concat()`. This way you can reliably control their order for concatenation using file and directory names.

### Dependencies / topological sorting

As of version 1.0, you can also let `concat()` control the resource order based on dependencies: 

```
path
`-- to
    |-- .dependencies.json
    `-- assets
        |-- 01_first.txt
        |-- 02_second
        |   |-- .dependencies.json
        |   |-- 01_second_first.txt
        |   `-- 02_second_second.txt
        `-- 03_third.txt
```

When flattening the directory `path/to/assets/02_second`, `concat()` will read `path/to/assets/02_second/.dependencies.json` and build a dependency graph based on the instructions inside that file. It will also collect and merge all  `.dependecies.json` files in parent directories. The format for `.dependencies.json` files is a follows:

```json
{
    "*.txt": [
        "path/to/assets/03_third.txt",
        "path/to/another/asset",
    ]
}
```

The example tells `concat()` the following:

> Whenever the resulting filename of the flattened `02_second` directory is going to match the glob pattern `*.txt`, then register the two dependencies `path/to/assets/03_third.txt` and `path/to/another/asset` for this resource . (The dependency `path/to/another/asset`  will be ignored as no such resource exists in the example.)

Given the above file structure, `concat()` will result in the following resource order:

* `path/to/assets/03_third.txt`: no dependency, but there is a dependent resources (`02_second.txt`), so this has to come before
* `path/to/assets/02_second.txt`: concatenated folder; depends on `03_third.txt`
* `path/to/assets/01_first.txt`:  no dependency, added at the end

By binding the dependency set to a glob pattern (`*.txt`) you can express multiple sets for different result file types (e.g. CSS and JavaScript files).

## Signature

```
/**
 * Concatenation by directory structure
 *
 * @param {String} base    Base directory
 * @param {String} ext     Optional: File extension
 *                         Will be used as file extension for concatenated directories
 * @param {Object} opt     Optional: Options, defaulting to:
 *                         {
 *                             newLine: "\n" // Concatenation string, may be empty
 *                         }
 */
concat(base, ext, opt);
```

**NOTE** that the `base` argument also accepts a [glob pattern](https://github.com/isaacs/node-glob) to match multiple base directories. 

## Changelog

Please refer to the [changelog](CHANGELOG.md) for a complete release history.

## Legal

Copyright © 2019 Joschi Kuphal <joschi@kuphal.net> / [@jkphl](https://twitter.com/jkphl).

*gulp-concat-flatten* is licensed under the terms of the [MIT license](LICENSE).


[npm-url]: https://npmjs.org/package/gulp-concat-flatten
[npm-image]: https://badge.fury.io/js/gulp-concat-flatten.png
[npm-downloads]: https://img.shields.io/npm/dm/gulp-concat-flatten.svg

[travis-url]: http://travis-ci.org/jkphl/gulp-concat-flatten
[travis-image]: https://secure.travis-ci.org/jkphl/gulp-concat-flatten.png

[coveralls-url]: https://coveralls.io/r/jkphl/gulp-concat-flatten
[coveralls-image]: https://img.shields.io/coveralls/jkphl/gulp-concat-flatten.svg

[depstat-url]: https://david-dm.org/jkphl/gulp-concat-flatten
[depstat-image]: https://david-dm.org/jkphl/gulp-concat-flatten/status.svg
[devdepstat-url]: https://david-dm.org/jkphl/gulp-concat-flatten?type=dev
[devdepstat-image]: https://david-dm.org/jkphl/gulp-concat-flatten/dev-status.svg
