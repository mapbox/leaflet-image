var queue = require('./queue');

// leaflet-image
module.exports = function leafletImage(map, callback) {

    var dimensions = map.getSize(),
        layerQueue = new queue(1);

    var canvas = document.createElement('canvas');
    canvas.width = dimensions.x;
    canvas.height = dimensions.y;
    var ctx = canvas.getContext('2d');

    // layers are drawn in the same order as they are composed in the DOM:
    // tiles, paths, and then markers
    map.eachLayer(drawTileLayer);
    if (map._pathRoot) layerQueue.defer(handlePathRoot, map._pathRoot);
    map.eachLayer(drawMarkerLayer);
    layerQueue.awaitAll(layersDone);

    function drawTileLayer(l) {
        if (l instanceof L.TileLayer) layerQueue.defer(handleTileLayer, l);
    }

    function drawMarkerLayer(l) {
        if (l instanceof L.Marker) layerQueue.defer(handleMarkerLayer, l);
    }

    function done() {
        callback(null, canvas);
    }

    function layersDone(err, layers) {
        if (err) throw err;
        layers.forEach(function(layer) {
            if (layer && layer.canvas) {
                ctx.drawImage(layer.canvas, 0, 0);
            }
        });
        done();
    }

    function handleTileLayer(layer, callback) {
        var canvas = document.createElement('canvas');

        canvas.width = dimensions.x;
        canvas.height = dimensions.y;

        var ctx = canvas.getContext('2d'),
            bounds = map.getPixelBounds(),
            origin = map.getPixelOrigin(),
            zoom = map.getZoom(),
            tileSize = layer.options.tileSize;

        if (zoom > layer.options.maxZoom ||
            zoom < layer.options.minZoom ||
            // mapbox.tileLayer
            (layer.options.format && !layer.options.tiles)) {
            return callback();
        }

        var offset = new L.Point(
            ((origin.x / tileSize) - Math.floor(origin.x / tileSize)) * tileSize,
            ((origin.y / tileSize) - Math.floor(origin.y / tileSize)) * tileSize
        );

        var tileBounds = L.bounds(
            bounds.min.divideBy(tileSize)._floor(),
            bounds.max.divideBy(tileSize)._floor()),
            tiles = [],
            center = tileBounds.getCenter(),
            j, i, point,
            tileQueue = new queue(1);

        for (j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
            for (i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
                tiles.push(new L.Point(i, j));
            }
        }

        tiles.forEach(queueTile);
        tileQueue.awaitAll(tileQueueFinish);

        function queueTile(tilePoint) {
            var originalTilePoint = tilePoint.clone();

            layer._adjustTilePoint(tilePoint);

            var tilePos = layer._getTilePos(originalTilePoint)
                .subtract(bounds.min)
                .add(origin);

            if (tilePoint.y >= 0) {
                var url = layer.getTileUrl(tilePoint) + '?cache=' + (+new Date());
                tileQueue.defer(loadTile, url, tilePos, tileSize);
            }
        }

        function loadTile(url, tilePos, tileSize, callback) {
            var im = new Image();
            im.crossOrigin = '';
            im.onload = function() {
                callback(null, {
                    img: this,
                    pos: tilePos,
                    size: tileSize
                });
            };
            im.src = url;
        }

        function tileQueueFinish(err, data) {
            data.forEach(drawTile);
            callback(null, { canvas: canvas });
        }

        function drawTile(d) {
            ctx.drawImage(d.img, Math.floor(d.pos.x), Math.floor(d.pos.y),
                d.size, d.size);
        }
    }

    function handlePathRoot(root, callback) {
        switch (root.tagName.toLowerCase()) {
            case 'canvas': return handlePathCanvas(root, callback);
            case 'svg': return handlePathSVG(root, callback);
        }
    }

    function handlePathCanvas(root, callback) {
        var bounds = map.getPixelBounds(),
            origin = map.getPixelOrigin(),
            canvas = document.createElement('canvas');
        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        var ctx = canvas.getContext('2d'),
            pos = L.DomUtil.getPosition(root)
                .subtract(bounds.min)
                .add(origin);
        ctx.drawImage(root, pos.x, pos.y);
        callback(null, {
            canvas: canvas
        });
    }

    function handlePathSVG(root, callback) {
        var bounds = map.getPixelBounds(),
            origin = map.getPixelOrigin(),
            canvas = document.createElement('canvas');

        canvas.width = dimensions.x;
        canvas.height = dimensions.y;

        var ctx = canvas.getContext('2d'),
            img = new Image(),
            pos = L.DomUtil.getPosition(root).subtract(bounds.min).add(origin);

        img.src = 'data:image/svg+xml;utf8,' +
            (new XMLSerializer()).serializeToString(root)
                .replace('<svg', "<svg xmlns='http://www.w3.org/2000/svg' ");


        ctx.drawImage(img, pos.x, pos.y);

        callback(null, {
            canvas: canvas
        });
    }

    function handleMarkerLayer(marker, callback) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            pixelBounds = map.getPixelBounds(),
            minPoint = new L.Point(pixelBounds.min.x, pixelBounds.min.y),
            pixelPoint = map.project(marker.getLatLng()),
            url = marker._icon.src + '?cache=false',
            im = new Image(),
            size = marker.options.icon.options.iconSize,
            pos = pixelPoint.subtract(minPoint),
            x = pos.x - (size[0] / 2),
            y = pos.y - size[1];

        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        im.crossOrigin = '';

        im.onload = function() {
            ctx.drawImage(this, x, y, size[0], size[1]);
            callback(null, {
                canvas: canvas
            });
        };

        im.src = url;
    }
};
