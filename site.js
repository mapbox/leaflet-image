var map = L.mapbox.map('map', 'tmcw.map-u4ca5hnt', {
    tileLayer: {
        detectRetina: true
    }
})
    .setView([38.9, -77.03], 14);

map.addLayer(L.geoJson(
    {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.03330039978026,
          38.904593064536805
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -77.03330039978026,
              38.904593064536805
            ],
            [
              -77.03330039978026,
              38.906463238984344
            ],
            [
              -77.03046798706055,
              38.906463238984344
            ],
            [
              -77.03046798706055,
              38.904593064536805
            ],
            [
              -77.03330039978026,
              38.904593064536805
            ]
          ]
        ]
      }
    },
        {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -77.03725934028625,
              38.896919824235354
            ],
            [
              -77.0367443561554,
              38.897621221219744
            ],
            [
              -77.03586459159851,
              38.89731227340173
            ],
            [
              -77.03576803207397,
              38.89664427352471
            ],
            [
              -77.03648686408997,
              38.896485622630514
            ],
            [
              -77.03725934028625,
              38.896919824235354
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            -77.03943729400635,
            38.893454487476816
          ],
          [
            -77.03924417495726,
            38.895592160976626
          ],
          [
            -77.03802108764648,
            38.896510672795266
          ],
          [
            -77.03686237335205,
            38.89549195896866
          ],
          [
            -77.0360255241394,
            38.897045074204925
          ],
          [
            -77.03536033630371,
            38.89597626736416
          ],
          [
            -77.03484535217285,
            38.89696157424977
          ],
          [
            -77.03415870666504,
            38.896176669872084
          ]
        ]
      }
    }
  ]
}
));

document.getElementById('output').addEventListener('click', function() {
    leafletImage(map, doImage);
});

window.setTimeout(function() {
    map.panBy([100, 100]);
    // map.setView([0, 0], 2);
    window.setTimeout(function() {
        leafletImage(map, doImage);
    }, 1000);
}, 1000);

function doImage(err, canvas) {
    var img = document.createElement('img');
    var dimensions = map.getSize();
    img.width = dimensions.x;
    img.height = dimensions.y;
    img.src = canvas.toDataURL();
    document.getElementById('images').innerHTML = '';
    document.getElementById('images').appendChild(img);
}
