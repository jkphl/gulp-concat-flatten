/* eslint no-unused-vars: "off" */
/* global describe it */
const path = require('path');
const assert = require('stream-assert');
const File = require('vinyl');
const gulp = require('gulp');
const sort = require('gulp-sort');
const sourcemaps = require('gulp-sourcemaps');
const test = require('./test-stream');
const concat = require('../');
require('mocha');
require('should');

const fixtures = glob => path.join(__dirname, 'fixtures', glob);

describe('gulp-concat-flatten', () => {
    describe('concat()', () => {
        it('should throw, when base directory is missing', () => {
            concat.should.throw('gulp-concat-flatten: Missing base directory');
        });

        it('should throw, when base directory is not a path', () => {
            concat.bind(null, true)
                .should
                .throw('gulp-concat-flatten: Base directory must be a directory path');
        });

        it('should throw, when no matching base directory exists', () => {
            concat.bind(null, 'invalid-directory')
                .should
                .throw('gulp-concat-flatten: No matching base directory exists');
        });

        it('should throw, when the base directory is not a directory', () => {
            concat.bind(null, 'index.js')
                .should
                .throw('gulp-concat-flatten: No matching base directory exists');
        });

        it('should ignore null files', (done) => {
            const stream = concat(fixtures(''));
            stream
                .pipe(assert.length(0))
                .pipe(assert.end(done));
            stream.write(new File());
            stream.end();
        });

        it('should ignore null files', (done) => {
            const stream = concat('*/fixtures/');
            stream
                .pipe(assert.length(0))
                .pipe(assert.end(done));
            stream.write(new File());
            stream.end();
        });

        it('should emit error on streamed file', (done) => {
            gulp.src(fixtures('*'), { buffer: false })
                .pipe(concat(fixtures('')))
                .once('error', (err) => {
                    err.message.should.eql('gulp-concat-flatten: Streaming not supported');
                    done();
                });
        });

        it('should concat one file', (done) => {
            test('wadap')
                .pipe(concat(fixtures('')))
                .pipe(assert.length(1))
                .pipe(assert.first((d) => {
                    d.basename.should.eql('file0.txt');
                    d.contents.toString().should.eql('wadap');
                }))
                .pipe(assert.end(done));
        });

        it('should concat multiple files', (done) => {
            gulp.src(fixtures('**/*'))
                .pipe(sort())
                .pipe(concat(fixtures(''), 'js'))
                .pipe(assert.length(3))
                .pipe(assert.first((d) => {
                    d.basename.should.eql('03_third.txt');
                    d.contents.toString().should.eql('3\n');
                }))
                .pipe(assert.second((d) => {
                    d.basename.should.eql('02_second.js');
                    d.contents.toString().should.eql('2.1\n\n2.2.1\n\n2.3\n');
                }))
                .pipe(assert.nth(3, (d) => {
                    d.basename.should.eql('01_first.txt');
                    d.contents.toString().should.eql('1\n');
                }))
                .pipe(assert.end(done));
        });

        it('should concat buffers', (done) => {
            test(() => 'test', [65, 66], [67, 68], [69, 70])
                .pipe(concat(fixtures('')))
                .pipe(assert.length(1))
                .pipe(assert.first((d) => {
                    d.basename.should.eql('test');
                    d.contents.toString().should.eql('AB\nCD\nEF');
                }))
                .pipe(assert.end(done));
        });

        it('should preserve mode from files', (done) => {
            test('wadaup')
                .pipe(concat(fixtures('')))
                .pipe(assert.length(1))
                .pipe(assert.first((d) => {
                    d.basename.should.eql('file0.txt');
                    d.stat.mode.should.eql(0o0666);
                }))
                .pipe(assert.end(done));
        });

        it('should support source maps', (done) => {
            gulp.src(fixtures('02_second/**/*'))
                .pipe(sourcemaps.init())
                .pipe(concat(fixtures(''), 'js'))
                .pipe(assert.length(1))
                .pipe(assert.first((d) => {
                    d.sourceMap.sources.should.have.length(3);
                    d.sourceMap.file.should.eql('test/fixtures/02_second.js');
                }))
                .pipe(assert.end(done));
        });

        it('should honor glob base directory', (done) => {
            gulp.src('fixtures/**/*', { cwd: __dirname })
                .pipe(sort())
                .pipe(concat(fixtures(''), 'js'))
                .pipe(assert.length(3))
                .pipe(assert.first((d) => {
                    d.path.should.eql(path.join('fixtures/01_first.txt'));
                    d.contents.toString().should.eql('1\n');
                }))
                .pipe(assert.second((d) => {
                    d.path.should.eql(path.join('fixtures/02_second.js'));
                    d.contents.toString().should.eql('2.1\n\n2.2.1\n\n2.3\n');
                }))
                .pipe(assert.nth(3, (d) => {
                    d.path.should.eql(path.join('fixtures/03_third.txt'));
                    d.contents.toString().should.eql('3\n');
                }))
                .pipe(assert.end(done));
        });

        describe('should not fail if no files were input', () => {
            it('when argument is a string', (done) => {
                const stream = concat(fixtures(''));
                stream.end();
                done();
            });
        });

        describe('options', () => {
            it('should support newLine', (done) => {
                test(() => 'test', 'wadap', 'doe')
                    .pipe(concat(fixtures(''), null, { newLine: '\r\n' }))
                    .pipe(assert.length(1))
                    .pipe(assert.first((d) => {
                        d.contents.toString().should.eql('wadap\r\ndoe');
                    }))
                    .pipe(assert.end(done));
            });

            it('should support empty newLine', (done) => {
                test(() => 'test', 'wadap', 'doe')
                    .pipe(concat(fixtures(''), null, { newLine: '' }))
                    .pipe(assert.length(1))
                    .pipe(assert.first((d) => {
                        d.contents.toString().should.eql('wadapdoe');
                    }))
                    .pipe(assert.end(done));
            });
        });
    });
});
