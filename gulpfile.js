'use strict';

/**
 * gulp-concat-flatten is a Gulp plugin for concatenating files based on their directory structure
 *
 * @see https://github.com/jkphl/gulp-concat-flatten
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2012 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/gulp-concat-flatten/master/LICENSE
 */

var gulp    	= require('gulp'),
jshint			= require('gulp-jshint');

gulp.task('lint', function () {
    gulp.src(['test/*.js', 'index.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'))
});

gulp.task('default', ['lint']);
