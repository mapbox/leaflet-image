(function(e){if("function"==typeof bootstrap)bootstrap("leafletimage",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeLeafletImage=e}else"undefined"!=typeof window?window.leafletImage=e():global.leafletImage=e()})(function(){var define,ses,bootstrap,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var queue = require('./queue');

// leaflet-image
module.exports = function leafletImage(map, callback) {

    var dimensions = map.getSize(),
        layerQueue = new queue(1);

    var canvas = document.createElement('canvas');
    canvas.width = dimensions.x;
    canvas.height = dimensions.y;
    var ctx = canvas.getContext('2d');

    // dummy canvas image when loadTile get 404 error
    // and layer don't have errorTileUrl
    var dummycanvas = document.createElement('canvas');
    dummycanvas.width = 1;
    dummycanvas.height = 1;
    var dummyctx = dummycanvas.getContext('2d');
    dummyctx.fillStyle = 'rgba(0,0,0,0)';
    dummyctx.fillRect(0, 0, 1, 1);

    // layers are drawn in the same order as they are composed in the DOM:
    // tiles, paths, and then markers
    map.eachLayer(drawTileLayer);
    if (map._pathRoot) {
        layerQueue.defer(handlePathRoot, map._pathRoot);
    } else if (map._panes && map._panes.overlayPane.firstChild) {
        layerQueue.defer(handlePathRoot, map._panes.overlayPane.firstChild);
    }
    map.eachLayer(drawMarkerLayer);
    layerQueue.awaitAll(layersDone);

    function drawTileLayer(l) {
        if (l instanceof L.TileLayer) layerQueue.defer(handleTileLayer, l);
        else if (l._heat) layerQueue.defer(handlePathRoot, l._canvas);
    }

    function drawMarkerLayer(l) {
        if (l instanceof L.Marker && l.options.icon instanceof L.Icon) {
            layerQueue.defer(handleMarkerLayer, l);
        }
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
        var isCanvasLayer = (layer instanceof L.TileLayer.Canvas),
            canvas = document.createElement('canvas');

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

        tiles.forEach(function(tilePoint) {
            var originalTilePoint = tilePoint.clone();

            if (layer._adjustTilePoint) {
                layer._adjustTilePoint(tilePoint);
            }

            var tilePos = layer._getTilePos(originalTilePoint)
                .subtract(bounds.min)
                .add(origin);

            if (tilePoint.y >= 0) {
                if (isCanvasLayer) {
                    var tile = layer._tiles[tilePoint.x + ':' + tilePoint.y];
                    tileQueue.defer(canvasTile, tile, tilePos, tileSize);
                } else {
                    var url = addCacheString(layer.getTileUrl(tilePoint));
                    tileQueue.defer(loadTile, url, tilePos, tileSize);
                }
            }
        });

        tileQueue.awaitAll(tileQueueFinish);

        function canvasTile(tile, tilePos, tileSize, callback) {
            callback(null, {
                img: tile,
                pos: tilePos,
                size: tileSize
            });
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
            im.onerror = function(e) {
                // use canvas instead of errorTileUrl if errorTileUrl get 404
                if (layer.options.errorTileUrl != '' && e.target.errorCheck === undefined) {
                    e.target.errorCheck = true;
                    e.target.src = layer.options.errorTileUrl;
                } else {
                    callback(null, {
                        img: dummycanvas,
                        pos: tilePos,
                        size: tileSize
                    });
                }
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
        var bounds = map.getPixelBounds(),
            origin = map.getPixelOrigin(),
            canvas = document.createElement('canvas');
        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        var ctx = canvas.getContext('2d');
        var pos = L.DomUtil.getPosition(root).subtract(bounds.min).add(origin);
        ctx.drawImage(root, pos.x, pos.y);
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
            isBase64 = /^data\:/.test(marker._icon.src),
            url = isBase64 ? marker._icon.src : addCacheString(marker._icon.src),
            im = new Image(),
            options = marker.options.icon.options,
            size = options.iconSize,
            pos = pixelPoint.subtract(minPoint),
            anchor = L.point(options.iconAnchor || size && size.divideBy(2, true));

        if (size instanceof L.Point) size = [size.x, size.y];

        var x = pos.x - size[0] + anchor.x,
            y = pos.y - anchor.y;

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

        if (isBase64) im.onload();
    }

    function addCacheString(url) {
        return url + ((url.match(/\?/)) ? '&' : '?') + 'cache=' + (+new Date());
    }
};

},{"./queue":2}],2:[function(require,module,exports){
(function() {
  if (typeof module === "undefined") self.queue = queue;
  else module.exports = queue;
  queue.version = "1.0.4";

  var slice = [].slice;

  function queue(parallelism) {
    var q,
        tasks = [],
        started = 0, // number of tasks that have been started (and perhaps finished)
        active = 0, // number of tasks currently being executed (started but not finished)
        remaining = 0, // number of tasks not yet finished
        popping, // inside a synchronous task callback?
        error = null,
        await = noop,
        all;

    if (!parallelism) parallelism = Infinity;

    function pop() {
      while (popping = started < tasks.length && active < parallelism) {
        var i = started++,
            t = tasks[i],
            a = slice.call(t, 1);
        a.push(callback(i));
        ++active;
        t[0].apply(null, a);
      }
    }

    function callback(i) {
      return function(e, r) {
        --active;
        if (error != null) return;
        if (e != null) {
          error = e; // ignore new tasks and squelch active callbacks
          started = remaining = NaN; // stop queued tasks from starting
          notify();
        } else {
          tasks[i] = r;
          if (--remaining) popping || pop();
          else notify();
        }
      };
    }

    function notify() {
      if (error != null) await(error);
      else if (all) await(error, tasks);
      else await.apply(null, [error].concat(tasks));
    }

    return q = {
      defer: function() {
        if (!error) {
          tasks.push(arguments);
          ++remaining;
          pop();
        }
        return q;
      },
      await: function(f) {
        await = f;
        all = false;
        if (!remaining) notify();
        return q;
      },
      awaitAll: function(f) {
        await = f;
        all = true;
        if (!remaining) notify();
        return q;
      }
    };
  }

  function noop() {}
})();

},{}]},{},[1])
(1)
});
;
