## leaflet-image

[![CircleCI](https://circleci.com/gh/mapbox/leaflet-image/tree/gh-pages.svg?style=svg)](https://circleci.com/gh/mapbox/leaflet-image/tree/gh-pages)

Export images out of Leaflet maps without a server component, by using
Canvas and [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).

## Requirements

* Tile layer providers (OSM, MapBox, etc) must support [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
* Any markers on the map must also support CORS. The default Leaflet-CDN markers
  don't, so they aren't supported.
* Your browser must support [CORS](http://caniuse.com/#feat=cors) and [Canvas](http://caniuse.com/#feat=canvas),
  so `IE >= 10` with no exceptions.
* This library **does not rasterize HTML** because **browsers cannot rasterize HTML**. Therefore,
  L.divIcon and other HTML-based features of a map, like zoom controls or legends, are not
  included in the output, because they are HTML.

__For Leaflet < 1.0.0__: You must set `L_PREFER_CANVAS = true;` so that vector
  layers are drawn in Canvas
  
__For Leaflet >= 1.0.0__: You must set `renderer: L.canvas()` for any layer that
  you want included in the generated image. You can also set this by setting [`preferCanvas: true`](http://leafletjs.com/reference-1.0.0.html#map-prefercanvas) in your map's options.
  
## Plugins that will _not_ work with leaflet-image

* Leaflet.label: will not work because it uses HTML to display labels.
* Leaflet.markercluster: will not work because it uses HTML for clusters.

### Usage

browserify

    npm install --save leaflet-image

web

    curl -L https://unpkg.com/leaflet-image@latest/leaflet-image.js > leaflet-image.js

### Example

```js
var map = L.mapbox.map('map', 'YOUR.MAPID').setView([38.9, -77.03], 14);
leafletImage(map, function(err, canvas) {
    // now you have canvas
    // example thing to do with that canvas:
    var img = document.createElement('img');
    var dimensions = map.getSize();
    img.width = dimensions.x;
    img.height = dimensions.y;
    img.src = canvas.toDataURL();
    document.getElementById('images').innerHTML = '';
    document.getElementById('images').appendChild(img);
});
```

### Plugin CDN

leaflet-image is [available through the Mapbox Plugin CDN](https://www.mapbox.com/mapbox.js/plugins/#leaflet-image) so you don't need to download & copy it. Just include the following script tag:

```html
<script src='//api.tiles.mapbox.com/mapbox.js/plugins/leaflet-image/v0.0.4/leaflet-image.js'></script>
```

### API

```js
leafletImage(map, callback)
```

map is a `L.map` or `L.mapbox.map`, callback takes `(err, canvas)`.

## Attribution

Any images you generate from maps that require attribution - which is most, including all from commercial sources and those that include any data from OpenStreetMap - will require the same attribution as the map did. Remember to attribute.

## See Also

* The [Mapbox Static Image API](https://www.mapbox.com/developers/api/static/) is simpler to use
  and faster than this approach.
