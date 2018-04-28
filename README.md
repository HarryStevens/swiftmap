# Swiftmap
A JavaScript library for making data-driven maps. [See it in action](https://bl.ocks.org/harrystevens/5b705c13618e20706675135fd412b6d1).

## Features

* Provides a simple API for making maps.

```js
var map = swiftmap.map()
  .layerPolygons(UsaStatesTopoJSON, d => d.stateName)
    .draw();
```

* Exposes DOM elements as D3 selections for styling.

```js
var colors = ["red", "orange", "yellow", "green", "blue", "purple"];
map.layers[0].polygons.style("fill", (d, i) => colors[i % colors.length]);
```

* Makes it easy to create resizable maps for responsive designs.

```js
window.onresize = () => map.resize();
```

* Uses simple abstractions for creating color schemes.

```js
var scheme = swiftmap.schemeSequential()
  .data(UsaStatesByPopulation, d => d.stateName)
  .from(d => d.population)
  .to(["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"]);

map.layers[0].polygons.style("fill", scheme);
```

## Installation

### Web browser
In vanilla, a `swiftmap` global is exported. You can use the CDN from unpkg.
```html
<script src="https://unpkg.com/swiftmap/dist/swiftmap.js"></script>
<script src="https://unpkg.com/swiftmap/dist/swiftmap.min.js"></script>
```
If you'd rather host it yourself, download `swiftmap.js` or `swiftmap.min.js` from the [`dist` directory](https://github.com/HarryStevens/swiftmap/tree/master/dist).
```html
<script src="path/to/swiftmap.js"></script>
<script src="path/to/swiftmap.min.js"></script>
```

### npm
```bash
npm install swiftmap --save
```
```js
var swiftmap = require("swiftmap");
```

## API Reference

- [Maps](#maps)
- [Layers](#layers)
  - [Polygons](#layerPolygons)
  - [Points](#layerPoints)
- [Schemes](#schemes)
  - [Categorical](#schemeCategorical)
  - [Continuous](#schemeContinuous)
  - [Sequential](#schemeSequential)

### Maps

Before drawing and styling a map, you can tell Swiftmap where on the DOM to place the map. You may also specify a map projection and call methods for resizing the map when the browser window's dimensions change.

<a name="map" href="#map">#</a> swiftmap.<b>map</b>([<i>parent</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/map.js "Source")

Initializes a map.

<i>parent</i><br />
If <i>parent</i> is specified, the map will be placed in the DOM element referenced by the parent's selector. The <i>parent</i> must be specified as a string. If <i>parent</i> is not specified, `"body"` will be used as the parent. The map will inherit the dimensions of its parent.

<a name="projection" href="#projection">#</a> <i>map</i>.<b>projection</b>([<i>projection</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/projection.js "Source")

Sets or gets a map's projection.

<i>projection</i><br />
If <i>projection</i> is specified, sets the map's projection. The <i>projection</i> must be specified as a string, and can be one of three options: 
- `"mercator"`, for the [Mercator projection](https://en.wikipedia.org/wiki/Mercator_projection)
- `"equirectangular"`, for the [equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection)
- `"albersUsa"`, for the Albers USA projection, which is a composite of three [Albers' equal-area conic projections](https://en.wikipedia.org/wiki/Albers_projection)

If <i>projection</i> is not specified, returns the projection associated with the map. For more information, see the [documentation in d3-geo](https://github.com/d3/d3-geo#projections).

<a name="resize" href="#resize">#</a> <i>map</i>.<b>resize</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/resize.js "Source")

Resizes the map. This method is useful if your map must respond to window resizes.

<a name="tiles" href="#tiles">#</a> <i>map</i>.<b>tiles</b>([<i>tilesource</i> | <i>tilefunction</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/tiles.js "Source")

Adds raster tiles to the map's background and exposes the CSS class `tile`. If you use these raster tiles, please include a copyright notice with your map. [See it in action](https://bl.ocks.org/HarryStevens/e605a99d49878fac2e2117256608a3a4).

<i>tilesource</i><br />
You can specify a <i>tilesource</i> as a string to determine the style of raster tiles. Defaults to `"openStreetMap"`. Your options are:

- `"cartoDark"` Carto dark tiles. Copyright: Map tiles by [Carto](https://carto.com/location-data-services/basemaps/).
- `"cartoDarkLabels"` Carto dark tiles' labels. Copyright: Map tiles by [Carto](https://carto.com/location-data-services/basemaps/).
- `"cartoLight"` Carto light tiles. Copyright: Map tiles by [Carto](https://carto.com/location-data-services/basemaps/).
- `"cartoLightLabels"` Carto light tiles' labels. Copyright: Map tiles by [Carto](https://carto.com/location-data-services/basemaps/).
- `"cartoLightNoLabels"` Carto light tiles without labels. Copyright: Map tiles by [Carto](https://carto.com/location-data-services/basemaps/).
- `"mapboxNaturalEarth"` Mapbox Natural Earth II. Copyright: Map tiles by [MapBox](http://a.tiles.mapbox.com/v3/mapbox.natural-earth-2/page.html).
- `"openStreetMap"` Open Street Map tiles. Copyright: Tiles copyright [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
- `"stamenToner"` Stamen toner tiles. Copyright: Map tiles by [Stamen Design](http://stamen.com/), under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0). Data by [OpenStreetMap](http://openstreetmap.org/), under [ODbL](http://www.openstreetmap.org/copyright).
- `"stamenTerrain"` Stamen terrain tiles. Copyright: Map tiles by [Stamen Design](http://stamen.com/), under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0). Data by [OpenStreetMap](http://openstreetmap.org/), under [ODbL](http://www.openstreetmap.org/copyright).
- `"stamenTerrainLabels"` Stamen terrain tiles' labels. Copyright: Map tiles by [Stamen Design](http://stamen.com/), under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0). Data by [OpenStreetMap](http://openstreetmap.org/), under [ODbL](http://www.openstreetmap.org/copyright).
- `"stamenTerrainNoLabels"` Stamen terrain tiles without labels. Copyright: Map tiles by [Stamen Design](http://stamen.com/), under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0). Data by [OpenStreetMap](http://openstreetmap.org/), under [ODbL](http://www.openstreetmap.org/copyright).
- `"stamenWatercolor"` Stamen watercolor tiles. Copyright: Map tiles by [Stamen Design](http://stamen.com/), under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0). Data by [OpenStreetMap](http://openstreetmap.org/), under [CC BY SA](http://creativecommons.org/licenses/by-sa/3.0).
- `"wikimedia"` Wikimedia tiles. Copyright: [Wikimedia](https://wikimediafoundation.org/wiki/Maps_Terms_of_Use) | © [OpenStreetMap](https://www.openstreetmap.org/copyright).

<i>tilefunction</i><br />
Instead of a <i>tilesource</i>, you can specify a <i>tilefunction</i> to generate a tiles URL. The tiles are generated by [d3-tile](https://github.com/d3/d3-tile) and have the properties `x`, `y`, `z`, `tx` and `ty`. You can [read more about these properties in the documentation](https://github.com/d3/d3-tile#_tile). For example, a <i>tilefunction</i> could be specified as:
```js
var tileGenerator = tile => "http://" + "abc"[tile.y % 3] + ".tile.openstreetmap.org/" + tile.z + "/" + tile.x + "/" + tile.y + ".png";

map.tiles(tileGenerator);
```

<b>Map attributes</b>

<a name="height" href="#height">#</a> <i>map</i>.<b>height</b><br />
<a name="width" href="#width">#</a> <i>map</i>.<b>width</b>

The map's dimensions.

<a name="svg" href="#svg">#</a> <i>map</i>.<b>svg</b>

The D3 selection of the SVG element containing the map.

<a name="parent" href="#parent">#</a> <i>map</i>.<b>parent</b>

A string of the map's parent element.

### Layers

Layers let you add geospatial data to a map, as well as decide how that data should be drawn to the DOM. The recommended indenting pattern is to indent two spaces to declare a new layer, calling either <i>map</i>.layerPolygons() or <i>map</i>.layerPoints(), and to indent four spaces when calling drawing functions on the preceding layer.

```js
var map = swiftmap.map("#map")
  .layerPolygons(TopoJSON, d => d.state_name, "states")
    .drawPolygons()
    .drawBoundary()
  .layerPolygons(TopoJSON, d => d.county_name, "counties")
    .draw()
  .layerPoints(TopoJSON, d => d.city_name, "cities")
    .drawPoints()
    .drawLabels(d => d.city_name);

map.layers[1].polygons.style("fill", scheme);
```

Layers can be styled with CSS selectors.

```css
#map .boundary {
  stroke-width: 2px;
}
#map .boundary.boundary-states {
  stroke-width: 3px;
}
#map .polygon {
  fill: none;
}
#map .polygon.polygon-counties {
  stroke-dasharray: 5, 5;
}
#map .point.point-cities {
  fill: blue;
}
#map .label.label-cities {
  font-size: 1.2em;
}
```

[See it in action](https://bl.ocks.org/HarryStevens/ef47557d3639243956e26261199ee91c).

<a name="layerPolygons" href="#layerPolygons">#</a> <i>map</i>.<b>layerPolygons</b>([<i>data</i>][, <i>key</i>][, <i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/layerPolygons.js "Source")

Sets or gets a polygons layer.

<i>data</i><br />
The <i>data</i> must be specified as a TopoJSON object. If no <i>data</i> is passed, returns the geospatial data associated with the layer.

<i>key</i><br />
Each datum will be assigned a key value based on the value returned by an optional <i>key</i> function. This key will be used to match each datum of geospatial data to a corresponding datum of tabular data when a scheme is passed to a style or attribute of the layer. If no <i>key</i> is specified, each datum will be assigned a key according to its index.

<i>layer</i><br />
If a <i>layer</i> is passed, the geospatial data will be associated with the name of the layer, which must be specified as a string. In the <i>layer</i> string, space characters will be converted to hyphens so that DOM elements produced by the layer's geospatial data can be referenced with CSS selectors.

If a <i>layer</i> is not passed, the geospatial data will be associated with the index of the layer, where the first layer is indexed to `0`. For instance, the name of the third layer added to the map will default to `2`, and can be styled with CSS using the following pattern:

```css
#map .boundary.boundary-2 {
  stroke-width: 2px;
}
```

<a name="draw" href="#draw">#</a> <i>polygons</i>.<b>draw</b>([<i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/draw.js "Source")

Draws a polygons layer. This is a convenience method equivalent to <i>map</i>.fit().drawPolygons().drawBoundary().

<i>layer</i><br />
If <i>layer</i> is not specified, the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the specified layer.

<a name="drawBoundary" href="#drawBoundary">#</a> <i>polygons</i>.<b>drawBoundary</b>([<i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawBoundary.js "Source")

Draws a polygons layer's outer boundary. The boundary is rendered as an SVG `path` element, can be accessed as a D3 selection via `map.layers.< layername >.boundary`, and can be styled with the CSS class `.boundary` or `.boundary-< layername >` or both.

<i>layer</i><br />
If <i>layer</i> is not specified, the boundary of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the boundary of the specified layer.

<a name="drawPoints-polygons" href="#drawPoints-polygons">#</a> <i>polygons</i>.<b>drawPoints</b>([<i>radius</i>][, <i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawPoints.js "Source")

Draws points at the centroid of each polygon in a polygons layer. Points are rendered as SVG `circle` elements, can be accessed as D3 selections via `map.layers.< layername >.points`, and can be styled with the CSS class `.point` or `.point-< layername >` or both.

<i>radius</i><br />
If <i>radius</i> is specified, sets each point's radius in pixels. Defaults to `2`.

<i>layer</i><br />
If <i>layer</i> is not specified, the points of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the polygons of the specified layer.

<a name="drawPolygons" href="#drawPolygons">#</a> <i>polygons</i>.<b>drawPolygons</b>([<i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawPolygons.js "Source")

Draws a polygons layer's polygons. For example, if the layer's TopoJSON contains states, the polygons are the states. Polygons are rendered as SVG `path` elements, can be accessed as D3 selections via `map.layers.< layername >.polygons`, and can be styled with the CSS class `.polygon` or `.polygon-< layername >` or both.

<i>layer</i><br />
If <i>layer</i> is not specified, the polygons of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the polygons of the specified layer.

<a name="fit-polygons" href="#fit-polygons">#</a> <i>polygons</i>.<b>fit</b>([<i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/fit.js "Source")

Updates the projection so that a layer's outer boundary fits the map's parent element. Overrides any previous invocations of <i>map</i>.fit(), as the map can only have one projection.

<i>layer</i><br />
If <i>layer</i> is not specified, the most recently added layer will be fit to the boundary of the parent element. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will fit the specified layer's outer boundary to the parent element.

<a name="layerPoints" href="#layerPoints">#</a> <i>map</i>.<b>layerPoints</b>([<i>data</i>][, <i>key</i>][, <i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/layerPoints.js "Source")

Sets or gets a points layer. See [<i>map</i>.polygons()](#polygons) for descriptions of the arguments.

<a name="drawLabels" href="#drawLabels">#</a> <i>points</i>.<b>drawLabels</b>(<i>key</i>[, <i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawLabels.js "Source")

Labels the points. Labels are rendered as SVG `text` elements, can be accessed as D3 selections via `map.layers.< layername >.labels`, and can be styled with the CSS class `.label` or `.label-< layername >` or both.

<i>key</i><br />
A <i>key</i> function tells Swiftmap how each datum should be labeled.

```js
var key = d => d.properties.name;

map.drawLabels(key);
```

<i>layer</i><br />
If <i>layer</i> is not specified, the labels of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the labels of the specified layer.

<a name="drawPoints-points" href="#drawPoints-points">#</a> <i>points</i>.<b>drawPoints</b>([<i>radius</i>][, <i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawPoints.js "Source")

Draws circles, located at each point's coordinates, to a layer. Points are rendered as SVG `circle` elements, can be accessed as D3 selections via `map.layers.< layername >.points`, and can be styled with the CSS class `.point` or `.point-< layername >` or both.

<i>radius</i><br />
If <i>radius</i> is specified, sets each point's radius in pixels. Defaults to `2`.

<i>layer</i><br />
If <i>layer</i> is not specified, the points of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the points of the specified layer.

<a name="fit-points" href="#fit-points">#</a> <i>points</i>.<b>fit</b>([<i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/fit.js "Source")

See [<i>polygons</i>.fit()](#fit-polygons).

### Schemes

Schemes provide an interface for mapping values of your data to visual attributes, such as a choropleth map's color palette or the radii of circles in a bubble map. Schemes can be added to a map like so:

```js
map.layers[0].style("fill", schemeSequential);
map.layers[1].attr("r", schemeContinuous);
map.layers[2].style("opacity", schemeCategorical);
```

[See it in action](https://bl.ocks.org/harrystevens/2fb3dce0b9f4930be9141bc6f418994f).

<a name="schemeCategorical" href="#schemeCategorical">#</a> swiftmap.<b>schemeCategorical</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/schemeCategorical.js "Source")

Categorical schemes are used to assign styles or attributes of layer elements, such as polygons' fill color, to non-numerical categories of data, such as political parties in an election.

```js
var scheme = swiftmap.schemeCategorical()
  .data(JSON, d => d.state)
  .from(d => d.party)
  .to({
    "Republican": "tomato",
    "Democratic": "steelblue"
  })
  .toOther("yellow");
```

[See it in action](https://bl.ocks.org/HarryStevens/bc32fe303275b00a2aeea96328a3b143).

<a name="data-categorical" href="#data-categorical">#</a> <i>categorical</i>.<b>data</b>([<i>data</i>][, <i>key</i>])

Adds data to a scheme, where each datum corresponds to each element of a layer.

<i>data</i><br />
The <i>data</i> must be specified as a JSON array. If no <i>data</i> is passed, returns the data associated with the scheme.

<i>key</i><br />
Each datum will be assigned a key value returned by an optional <i>key</i> function. This key will be used to match each datum of tabular data to a corresponding datum of geospatial data when the scheme is passed to a style or attribute of a layer. If no <i>key</i> is specified, each datum will be assigned a key according to its index.

<a name="from-categorical" href="#from-categorical">#</a> <i>categorical</i>.<b>from</b>(<i>function</i>)

Sets the values accessor to the specified <i>function</i>, allowing the scheme to interact with a layer's data. 

<i>function</i><br />
When the scheme is passed to a style or attribute of a layer, the <i>function</i> will be called for each datum in the layer's data array, being passed the datum `d`, the index `i`, and the array `data` as three arguments. For example, if you want your scheme to be based on each polygon's party:

```js
var data = [
  {party: "Democratic", state: "California"},
  {party: "Republican", state: "Texas"},
  ...
];

scheme
  .data(data, d => d.state)
  .from(d => d.party);

map.layers[0].polygons.style("fill", scheme);
```

<a name="to-categorical" href="#to-categorical">#</a> <i>categorical</i>.<b>to</b>([<i>object</i>])

Specifies how the scheme should visually render the values returned by <i>categorical</i>.from().

<i>object</i><br />
If an <i>object</i> is specified, it must be specified as an object where each property is one of the scheme's categories – that is, a value returned by <i>categorical</i>.from() – and each value is the visual style or attribute associated with that category.

```js
scheme.to({
  "Republican": "tomato",
  "Democratic": "steelblue"
});
```

If <i>object</i> is not specified, returns the object associated with the scheme.

<a name="toOther-categorical" href="#toOther-categorical">#</a> <i>categorical</i>.<b>toOther</b>([<i>value</i>])

Sets or gets an alternative value in the scheme.

<i>value</i><br />
If a <i>value</i> is specified, assigns values to those DOM elements whose category is not present among the properties of the object passed to <i>categorical</i>.to(). If <i>value</i> is not specified, returns the scheme's alternative value, which defaults to `null`.

<a name="schemeContinuous" href="#schemeContinuous">#</a> swiftmap.<b>schemeContinuous</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/schemeContinuous.js "Source")

Continuous schemes are used to map values of data to corresponding visual attributes along a continuum. You can use a continuous scheme to make a [bubble map](https://bl.ocks.org/harrystevens/2fb3dce0b9f4930be9141bc6f418994f) where the radius of each bubbble corresponds to the magnitude of each datum. You can also use a continuous scheme to create [choropleth maps with a gradient scale](https://bl.ocks.org/harrystevens/4608d25b2f424a2e011d7ab9cc804f4e).

```js
var scheme = swiftmap.schemeContinuous()
  .data(JSON)
  .from(d => d.value)
  .to([2, 20]);
```

[See it in action](https://bl.ocks.org/HarryStevens/ab09e52c2d513ae7e6aa783cbd9dc1c3).

<a name="data-continuous" href="#data-continuous">#</a> <i>continuous</i>.<b>data</b>([<i>data</i>][, <i>key</i>])

See [<i>categorical</i>.data()](#data-categorical).

<a name="from-continuous" href="#from-continuous">#</a> <i>continuous</i>.<b>from</b>(<i>function</i>)

See [<i>categorical</i>.from()](#from-categorical).

<a name="to-continuous" href="#to-continuous">#</a> <i>continuous</i>.<b>to</b>([<i>array</i>])

Sets or gets the minimum and maximum values of a visual attribute associated with the scheme.

<i>array</i><br />
If a <i>array</i> is specified, sets the sequence of values of the the visual attribute associate with the scheme. The array can contain as many items as you like, and the scheme will map data values returned by <i>continuous</i>.from() to corresponding values in the <i>array</i>. If a <i>array</i> is not specified, returns the array associated with the scheme, which defaults to `[0, 1]`.

<a name="toOther-continuous" href="#toOther-continuous">#</a> <i>continuous</i>.<b>toOther</b>([<i>value</i>])

See [<i>categorical</i>.toOther()](#toOther-categorical).

<a name="schemeSequential" href="#schemeSequential">#</a> swiftmap.<b>schemeSequential</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/schemeSequential.js "Source")

Sequential schemes are used to assign styles or attributes of layer elements, such as polygons' fill color, to discrete ranges in a series of values that progress from low to high.

```js
var scheme = swiftmap.schemeSequential()
  .data(JSON)
  .from(d => d.value)
  .to(["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"])
  .breaks("q");
```

[See it in action](https://bl.ocks.org/HarryStevens/4db2b695df4b02042bfa0c1ee6eac299).

<a name="breaks" href="#breaks">#</a> <i>sequential</i>.<b>breaks</b>([<i>breaktype</i> | <i>breaklist</i>])

Computes class breaks based on data. If no argument is passed, returns the scheme's <i>breaklist</i> – an array of numbers representing the breaks associated with the scheme.

<i>breaktype</i><br />
If a <i>breaktype</i> is specified, the scheme will compute the class breaks based on the values returned by the <i>function</i> passed to [<i>sequential</i>.from()](#from-sequential). The <i>breaktype</i> must be specified as a string, either `"e"`, `"q"`, `"l"` or `"k"`.
- `"e"` specifies <b>equidistant</b> breaks, where each break spans an equal numeric range.
- `"l"` specifies <b>logarithmic</b> breaks, which are just like equidistant breaks but on a logarithmic scale.
- `"q"` specifies <b>quantile</b> breaks, where an equal number of data points are placed into each break.
- `"k"` specifies <b>k-means</b> breaks, which use a [<i>k</i>-means clustering](https://en.wikipedia.org/wiki/K-means_clustering) algorithm to group similar data points with each other.

The <i>breaktype</i> will default to `"q"` if <i>sequential</i>.breaks() is not called.

<i>breaklist</i><br />
If you'd rather use custom breaks, you can specify a <i>breaklist</i> as an array of numbers. The length of the <i>breaklist</i> should be one greater than the length of the <i>array</i> passed to [<i>sequential</i>.to()](#to-sequential), and its extent should span the range of values returned by the <i>function</i> passed to [<i>sequential</i>.from()](#from-sequential). 

```js
var scheme = swiftmap.schemeSequential()
  .from(d => d.value)
  .to(["tomato", "lightblue", "steelblue", "darkblue"])
  .breaks([-.5, 0, 20, 25, 55]);
```

[See it in action](https://bl.ocks.org/HarryStevens/9d052eec2ab33d0a84a4475030ede896).

<a name="data-sequential" href="#data-sequential">#</a> <i>sequential</i>.<b>data</b>([<i>data</i>][, <i>key</i>])

See [<i>categorical</i>.data()](#data-categorical).

<a name="from-sequential" href="#from-sequential">#</a> <i>sequential</i>.<b>from</b>(<i>function</i>)

See [<i>categorical</i>.from()](#from-categorical). For example, if you want your scheme to be based on each polygon's population density:

```js
var data = [
  {population: "15324", area: "124", county: "Foo"},
  {population: "23540", area: "365", county: "Bar"},
  ...
];

scheme
  .data(data, d => d.county)
  .from(d => +d.population / +d.area);

map.layers[0].polygons.style("fill", scheme);
```

<a name="to-sequential" href="#to-sequential">#</a> <i>sequential</i>.<b>to</b>([<i>array</i>])

Specifies the series of styles or attributes to which values should be assigned, such as a serious of color buckets in a choropleth map.

<i>array</i><br />
If an <i>array</i> is specified, the scheme will assign a series of values to each item in the <i>array</i>. If <i>array</i> is not specified, returns the array associated with the scheme.

The <i>array</i> will default to `[]` if this method is not called.

<a name="toOther-sequential" href="#toOther-sequential">#</a> <i>sequential</i>.<b>toOther</b>([<i>value</i>])

See [<i>categorical</i>.toOther()](#toOther-categorical).

## Contributing

```bash
git clone https://github.com/HarryStevens/swiftmap # clone this repository
cd swiftmap # navigate into the directory
npm install # install node modules
```

Swiftmap is compiled with [rollup](https://github.com/rollup/rollup). Each function can be found in the [`src` directory](https://github.com/HarryStevens/swiftmap/tree/master/lib).

```bash
npm run rollup # compile the library
npm run minify # minify the library
npm run build # compile and minify the library
```

Swiftmap also uses a custom version of D3.js, which can be found in [`lib/d3`](https://github.com/HarryStevens/swiftmap/tree/master/lib/d3). If you need to update the bundle, do `cd lib/d3`, where you can install additional dependencies and update the [`index.js`](https://github.com/HarryStevens/swiftmap/blob/master/lib/d3/index.js) file. You will also have to update the `globals` object and the `only` array in the `resolve()` function in [`rollup.config.js`](https://github.com/HarryStevens/swiftmap/blob/master/rollup.config.js).