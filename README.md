# gulp-concat-flatten [![NPM version][npm-image]][npm-url] [![NPM downloads][npm-downloads]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url] [![Development Dependency Status][devdepstat-image]][devdepstat-url]
===============

is a Gulp plugin 


## Usage

First, install `gulp-concat-flatten` as a development dependency:

```shell
npm install --save-dev gulp-concat-flatten
```

Then, add it to your `gulpfile.js`:

```javascript
var gulp				= require('gulp'),
svgSprite				= require('gulp-concat-flatten');

gulp.src('path/to/assets/*.svg')
	.pipe(svgSprite( /* ... Insert your configuration here ... */ ))
	.pipe(gulp.dest('out'));
```


Changelog
---------

Please refer to the [changelog](CHANGELOG.md) for a complete release history.


Legal
-----
Copyright © 2016 Joschi Kuphal <joschi@kuphal.net> / [@jkphl](https://twitter.com/jkphl). *gulp-concat-flatten* is licensed under the terms of the [MIT license](LICENSE.txt).


[npm-url]: https://npmjs.org/package/gulp-concat-flatten
[npm-image]: https://badge.fury.io/js/gulp-concat-flatten.png
[npm-downloads]: https://img.shields.io/npm/dm/gulp-concat-flatten.svg

[travis-url]: http://travis-ci.org/jkphl/gulp-concat-flatten
[travis-image]: https://secure.travis-ci.org/jkphl/gulp-concat-flatten.png

[coveralls-url]: https://coveralls.io/r/jkphl/gulp-concat-flatten
[coveralls-image]: https://img.shields.io/coveralls/jkphl/gulp-concat-flatten.svg

[depstat-url]: https://david-dm.org/jkphl/gulp-concat-flatten
[depstat-image]: https://david-dm.org/jkphl/gulp-concat-flatten.svg
[devdepstat-url]: https://david-dm.org/jkphl/gulp-concat-flatten#info=devDependencies
[devdepstat-image]: https://david-dm.org/jkphl/gulp-concat-flatten/dev-status.svg
