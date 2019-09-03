/* eslint no-plusplus: "off" */
const array = require('stream-array');
const File = require('vinyl');
const path = require('path');

module.exports = (...args) => {
    let i = 0;
    let fn = () => `file${(i++).toString()}.txt`;
    if (args.length && (typeof args[0] === 'function')) {
        fn = args.shift();
    }
    const fixtures = path.join(__dirname, 'fixtures');
    return array(args.map((contents) => new File({
        cwd: fixtures,
        base: fixtures,
        path: `${fixtures}/${fn()}`,
        contents: Buffer.from(contents),
        stat: { mode: 0o0666 },
    })));
};
