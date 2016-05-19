Before you post an issue, please review this document! Many of your questions,
like "why isn't leaflet-image working" or "will it work with a plugin",
are answered below.

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
