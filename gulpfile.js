/**
 * gulp-concat-flatten is a Gulp plugin for concatenating files based on their directory structure
 *
 * @see https://github.com/jkphl/gulp-concat-flatten
 *
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @copyright © 2019 Joschi Kuphal
 * @license MIT https://raw.github.com/jkphl/gulp-concat-flatten/master/LICENSE
 */

const gulp = require('gulp');
const jshint = require('gulp-jshint');

gulp.task('lint', (done) => {
    gulp.src(['test/*.js', 'index.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
    done();
});

gulp.task('default', gulp.series('lint'));
