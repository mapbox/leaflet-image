var path = require('path');
var concat = require('concat-stream');
var test = require('tape');
var pixelmatch = require('pixelmatch');
var fs = require('fs');
var Pageres = require('pageres');

['simple', 'circle-marker', 'osm', 'one-point-oh',
    'style-layer', 'no-tiles', 'wms'].forEach(name => {
    test(name, t => {
        const pageres = new Pageres({ delay: 5 })
            .src(path.join(__dirname, 'pages/', name + '.html'), ['400x400'])
            .run()
            .then(res => {
                res[0].pipe(concat(function(buf) {
                    if (process.env.UPDATE) {
                        fs.writeFileSync(path.join(__dirname, 'out', name + '.png'), buf);
                    }
                    var expected = fs.readFileSync(path.join(__dirname, 'out/', name + '.png'));
                    t.equal(pixelmatch(expected, buf), 0, 'image matches');
                    t.end();
                }));
            }, err => {
                t.ifError(err);
            });
    });
});
