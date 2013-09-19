## leaflet-image

Export images out of Leaflet maps without a server component, by using
Canvas and [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).

### usage

browserify

    npm install --save leaflet-image

web

    curl https://raw.github.com/mapbox/leaflet-image/gh-pages/leaflet-image.js > leaflet-image.js

### example

```js
var map = L.mapbox.map('map', 'tmcw.map-u4ca5hnt').setView([38.9, -77.03], 14);
leafletImage(map, function(canvas) {
    // now you have canvas
});

// example thing to do with that canvas
function doImage(err, canvas) {
    var img = document.createElement('img');
    var dimensions = map.getSize();
    img.width = dimensions.x;
    img.height = dimensions.y;
    img.src = canvas.toDataURL();
    document.getElementById('images').innerHTML = '';
    document.getElementById('images').appendChild(img);
}
```

### api

```js
leafletImage(map, callback)
```

map is a `L.map` or `L.mapbox.map`, callback takes `(err, canvas)`.
