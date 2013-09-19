(function(e){if("function"==typeof bootstrap)bootstrap("leafletimage",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeLeafletImage=e}else"undefined"!=typeof window?window.leafletImage=e():global.leafletImage=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var queue = require('./queue');

module.exports = function leafletImage(map, callback) {
    var dimensions = map.getSize(),
        layerQueue = new queue(1);

    map.eachLayer(function(l) {
        if (l instanceof L.TileLayer) {
            layerQueue.defer(handleTileLayer, l);
        }
    });

    if (map._pathRoot) {
        layerQueue.defer(handlePathRoot, map._pathRoot);
    }

    map.eachLayer(function(l) {
        if (l instanceof L.Marker) {
            layerQueue.defer(handleMarkerLayer, l);
        }
    });

    var canvas = document.createElement('canvas');
    canvas.width = dimensions.x;
    canvas.height = dimensions.y;
    var ctx = canvas.getContext('2d');

    function done() {
        callback(null, canvas);
    }

    layerQueue.awaitAll(function(err, layers) {
        if (err) throw err;
        layers.forEach(function(layer) {
            if (layer && layer.canvas) {
                ctx.drawImage(layer.canvas, 0, 0);
            }
        });
        done();
    });

    function handleTileLayer(layer, callback) {
        var canvas = document.createElement('canvas');
        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        var ctx = canvas.getContext('2d');
        var bounds = map.getPixelBounds(),
            zoom = map.getZoom(),
            tileSize = layer.options.tileSize;

        if (!layer.options.tiles || zoom > layer.options.maxZoom || zoom < layer.options.minZoom) {
            return callback();
        }

        var tileBounds = L.bounds(
            bounds.min.divideBy(tileSize)._floor(),
            bounds.max.divideBy(tileSize)._floor());

        var tiles = [],
            center = tileBounds.getCenter();

        var j, i, point;

        for (j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
            for (i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
                tiles.push(new L.Point(i, j));
            }
        }

        var tileQueue = new queue(1);

        tiles.forEach(function(tilePoint) {
            tileQueue.defer(function(callback) {
                layer._adjustTilePoint(tilePoint);
                var tilePos = layer._getTilePos(tilePoint);
                var url = layer.getTileUrl(tilePoint) + '?cache=' + (+new Date());
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
            });
            tileQueue.awaitAll(function(err, data) {
                data.forEach(function(d) {
                    ctx.drawImage(d.img, Math.floor(d.pos.x), Math.floor(d.pos.y),
                        d.size, d.size);
                });
                callback(null, {
                    canvas: canvas
                });
            });
        });
    }

    function handlePathRoot(root, callback) {
        var canvas = document.createElement('canvas');
        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        var ctx = canvas.getContext('2d');
        var pos = L.DomUtil.getPosition(root);
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

},{}]},{},[1])(1)
});
;