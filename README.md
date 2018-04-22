# Swiftmap
A simple API for making awesome maps. [See it in action](https://bl.ocks.org/harrystevens/5b705c13618e20706675135fd412b6d1).

## Features

* Provides a simple API for making maps.

```js
var map = swiftmap.map().polygons(TopoJSONObject).draw();
```

* Exposes DOM elements as D3 selections for styling.

```js
var colors = ["red", "orange", "yellow", "green", "blue", "purple"];
map.layers[0].subunits.style("fill", (d, i) => colors[i % colors.length]);
```

* Makes it easy to create resizable maps for responsive designs.

```js
window.onresize = () => map.resize();
```

* Uses simple abstractions for creating color schemes.

```js
var scheme = swiftmap.schemeSequential()
  .data(JSON, d => d.subunit)
  .values(d => d.population)
  .colors(["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"]);

map.drawScheme(scheme);
```

[See it in action](https://bl.ocks.org/harrystevens/5b705c13618e20706675135fd412b6d1).

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
  - [Polygons](#polygons)
  - [Points](#points)
- [Schemes](#schemes)
  - [Categorical](#schemeCategorical)
  - [Sequential](#schemeSequential)
  - [Bubble](#schemeBubble)

### Maps

Before drawing and styling a map, you can tell Swiftmap where on the DOM to place the map. You may also specify a map projection and call methods for resizing the map when the browser window's dimensions change.

<a name="map" href="#map">#</a> swiftmap.<b>map</b>([<i>parent</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/map.js "Source")

Initializes a <i>map</i>.

<i>parent</i><br />
If <i>parent</i> is specified, the <i>map</i> will be placed in the DOM element referenced by the parent's selector. The <i>parent</i> must be specified as a string. If <i>parent</i> is not specified, `"body"` will be used as the parent.

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

<b>Map attributes</b>

<a name="height" href="#height">#</a> <i>map</i>.<b>height</b><br />
<a name="width" href="#width">#</a> <i>map</i>.<b>width</b>

The map's dimensions.

<a name="svg" href="#svg">#</a> <i>map</i>.<b>svg</b>

The D3 selection of the SVG element containing the map.

<a name="parent" href="#parent">#</a> <i>map</i>.<b>parent</b>

A string of the map's parent element.

### Layers

Layers let you add geospatial data to a <i>map</i>, as well as decide how that data should be drawn to the DOM. The recommended indenting pattern is to indent two spaces to declare a new layer, invoking either <i>map</i>.polygons() or <i>map</i>.points(), and to indent four spaces when invoking drawing functions on the preceding layer.

```js
swiftmap.map("#map")
  .polygons(TopoJSON, d => d.state_name, "states")
    .drawSubunits()
    .drawBoundary()
  .polygons(TopoJSON, d => d.county_name, "counties")
    .draw()
    .drawScheme(scheme)
  .points(TopoJSON, d => d.city_name, "cities")
    .drawPoints()
    .drawLabels(d => d.city_name);
```

Layers can be styled with CSS selectors.

```css
#map .boundary {
  stroke-width: 2px;
}
#map .boundary.boundary-states {
  stroke-width: 3px;
}
#map .subunit {
  fill: none;
}
#map .subunit.subunit-counties {
  stroke-dasharray: 5, 5;
}
#map .point.point-cities {
  fill: blue;
}
#map .label.label-cities {
  font-size: 1.2em;
}
```

<a name="polygons" href="#polygons">#</a> <i>map</i>.<b>polygons</b>([<i>data</i>[, <i>key</i>, <i>layer</i>]]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/polygons.js "Source")

Sets or gets a polygons layer.

<i>data</i><br />
The <i>data</i> must be specified as a TopoJSON object. If no <i>data</i> is passed, returns the geospatial data associated with the layer.

<i>key</i><br />
Each datum will be assigned a key value based on the value returned by an optional <i>key</i> function. This key will be used to match each datum of geospatial data to a corresponding datum of tabular data. If no <i>key</i> is specified, each datum will be assigned a key according to its index.

<i>layer</i><br />
If a <i>layer</i> is passed, the geospatial data will be associated with with the name of the layer, which must be specified as a string. In the <i>layer</i> string, space characters will be converted to hyphens so that DOM elements produced by the layer's geospatial data can be referenced with CSS selectors.

If a <i>layer</i> is not passed, the geospatial data will be associated with the index of the layer, where the first layer is indexed to `0`. For instance, the name of the third layer added to the map will default to `2`, and can be styled with CSS using the following pattern:

```css
#map .boundary.boundary-2 {
  stroke-width: 2px;
}
```

<a name="draw" href="#draw">#</a> <i>map</i>.<b>draw</b>([layer]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/draw.js "Source")

Draws a polygons layer. This is a convenience method equivalent to <i>map</i>.fit().drawSubunits().drawBoundary().

<i>layer</i><br />
If <i>layer</i> is not specified, the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the specified layer.

<a name="drawBoundary" href="#drawBoundary">#</a> <i>map</i>.<b>drawBoundary</b>([layer]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawBoundary.js "Source")

Draws a polygons layer's outer boundary.

<i>layer</i><br />
If <i>layer</i> is not specified, the boundary of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the boundary of the specified layer.

<a name="drawSubunits" href="#drawSubunits">#</a> <i>map</i>.<b>drawSubunits</b>([layer]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawSubunits.js "Source")

Draws a polygons layer's subunits. For example, if the layer's TopoJSON contains states, the subunits are the states.

<i>layer</i><br />
If <i>layer</i> is not specified, the subunits of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the subunits of the specified layer.

<a name="drawScheme" href="#drawScheme">#</a> <i>map</i>.<b>drawScheme</b>(<i>scheme</i>[, <i>duration</i>, <i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawScheme.js "Source")

Styles a polygons layer based on a scheme.

<i>scheme</i><br />
If the <i>scheme</i> is either [categorical](#schemeCategorical) or [sequential](#schemeSequential), fills the map's subunits to create a choropleth map based on the scheme. [See it in action](https://bl.ocks.org/HarryStevens/4db2b695df4b02042bfa0c1ee6eac299).

If the <i>scheme</i> is a [bubble scheme](#schemeBubbles), draws bubbles on the centroids of the map's subunits based the scheme. [See it in action](https://bl.ocks.org/HarryStevens/ab09e52c2d513ae7e6aa783cbd9dc1c3).

<i>duration</i><br />
An optional <i>duration</i> may be specified to enable an animated transition from the current style to the new style. The <i>duration</i> must be specified as a positive number corresponding to the time of the transition in milliseconds. 

<i>layer</i><br />
If <i>layer</i> is not specified, the most recently added layer will be styled by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will style or restyle the specified layer.

<a name="fit" href="#fit">#</a> <i>map</i>.<b>fit</b>([<i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/fit.js "Source")

Updates the projection so that a layer's outer boundary fits the <i>map</i>'s parent element. Overrides any previous invocations of <i>map</i>.fit(), as the map can only have one projection.

<i>layer</i><br />
If <i>layer</i> is not specified, the most recently added layer will be fit the the boundary of the parent element. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will fit the specified layer's outer boundary to the parent element.

<b>Polygons layer attributes</b>

When drawn to the map, polygons layers will have D3 selections associated with them.

<a name="boundary" href="#boundary">#</a> <i>map</i>.layers.< layername >.<b>boundary</b><br />
<a name="subunits" href="#subunits">#</a> <i>map</i>.layers.< layername >.<b>subunits</b>

[D3 selections](https://github.com/d3/d3-selection) of a polygons layer's boundary and subunits. These attributes are only available after calling <i>map</i>.drawBoundary(), <i>map</i>.drawSubunits(), or <i>map</i>.draw(), which makes both available.

<a name="bubbles" href="#bubbles">#</a> <i>map</i>.layers.< layername >.<b>bubbles</b>

[D3 selection](https://github.com/d3/d3-selection) of a polygons layers's bubbles after invoking <i>map</i>.drawScheme().

<b>Polygons layer styles</b>

Maps rendered with Swiftmap can be styled with CSS. The boundary is exposed as the class `boundary`, and the subunits are exposed as the class `subunit`. If you add a bubble scheme to a polygons layer, the bubbles are exposed as the class `bubble`.

<a name="points" href="#points">#</a> <i>map</i>.<b>points</b>([<i>data</i>[, <i>key</i>, <i>layer</i>]]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/points.js "Source")

Sets or gets a points layer. See [<i>map</i>.polygons()](#polygons) for descriptions of the arguments.

<a name="drawLabels" href="#drawLabels">#</a> <i>map</i>.<b>drawLabels</b>(<i>key</i>[, <i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawLabels.js "Source")

Labels the points with text.

<i>key</i><br />
A <i>key</i> function tells Swiftmap how each datum should be labeled.

```js
var key = d => d.properties.name;

map.drawLabels(key);
```

<i>layer</i><br />
If <i>layer</i> is not specified, the labels of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the labels of the specified layer.

<a name="drawPoints" href="#drawPoints">#</a> <i>map</i>.<b>drawPoints</b>([<i>radius</i>, <i>duration</i>, <i>layer</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/map/drawPoints.js "Source")`

Draws circles to the layer located at each point's coordinates.

<i>radius</i><br />
If <i>radius</i> is specified, sets each point's radius in pixels. Defaults to `2`.

<i>duration</i><br />
An optional <i>duration</i> may be specified to enable an animated transition from the current radius to the new radius. The <i>duration</i> must be specified as a positive number corresponding to the time of the transition in milliseconds. 

<i>layer</i><br />
If <i>layer</i> is not specified, the points of the most recently added layer will be drawn by default. If you wish to change the default behavior, you may specify a <i>layer</i> as a string or a number corresponding to a layer that has already been added to the map, and Swiftmap will draw or redraw the points of the specified layer.

<b>Points layer attributes</b>

When drawn to the map, points layers will have D3 selections associated with them.

<a name="labels" href="#labels">#</a> <i>map</i>.layers.< layername >.<b>labels</b><br />

[D3 selections](https://github.com/d3/d3-selection) of a points layer's labels. This attribute is only available after calling <i>map</i>.drawLabels(); 

<a name="points" href="#points">#</a> <i>map</i>.layers.< layername >.<b>points</b><br />

[D3 selections](https://github.com/d3/d3-selection) of a points layer's points. This attribute is only available after calling <i>map</i>.drawPoints();

<b>Points layer styles</b>

Maps rendered with Swiftmap can be styled with CSS. The labels are exposed as the class `label`, and the points are exposed as the class `point`. If you add a bubble scheme to a points layer, the bubbles are exposed as the class `bubble`.

### Schemes

Schemes provide an interface for mapping values of your data to visual attributes, such as a choropleth map's color palette or the radii of circles in a bubble map. Schemes can be added to a map like so:

```js
map.drawScheme(scheme);
```

<a name="schemeCategorical" href="#schemeCategorical">#</a> swiftmap.<b>schemeCategorical</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/schemeCategorical.js "Source")

Categorical schemes are used to assign colors to non-numerical categories of data, such as political parties in an election.

```js
var scheme = swiftmap.schemeCategorical()
  .data(JSON, d => d.state)
  .colors({
    "Republican": "tomato",
    "Democratic": "steelblue"
  })
  .colorOther("yellow")
  .values(d => d.party);
```

[See it in action](https://bl.ocks.org/HarryStevens/bc32fe303275b00a2aeea96328a3b143).

<a name="data-categorical" href="#data-categorical">#</a> <i>categorical</i>.<b>data</b>([<i>data</i>[, <i>key</i>]]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/data.js "Source")

Adds data to the <i>scheme</i>, where each datum corresponds to each subunit of a <i>map</i>.

<i>data</i><br />
The <i>data</i> must be specified as a JSON array. If no <i>data</i> is passed, returns the data associated with the <i>scheme</i>.

<i>key</i><br />
Each datum will be assigned a key value based on the value returned by an optional <i>key</i> function. This key will be used to match each datum of tabular data to a corresponding datum of geospatial data when the scheme is passed to <i>map</i>.drawScheme(). If no <i>key</i> is specified, each datum will be assigned a key according to its index.

<a name="colors-categorical" href="#colors-categorical">#</a> <i>categorical</i>.<b>colors</b>([<i>palette</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/colors.js "Source")

Specifies which colors should be associated with which values.

<i>palette</i><br />
If a <i>palette</i> is specified, it must be specified as an object where each property is one of the scheme's categories, and each value is the color associated with that category.

```js
scheme.colors({
  "Republican": "tomato",
  "Democratic": "steelblue"
});
```

If <i>palette</i> is not specified, returns the color palette associated with the scheme.

<a name="colorOther" href="#colorOther">#</a> <i>categorical</i>.<b>colorOther</b>([<i>color</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/colorOther.js "Source")

Sets or gets an alternative color in the scheme.

<i>color</i><br />
If a <i>color</i> is specified, assigns a color to those subunits whose category is not present among the properties of the object passed to <i>categorical</i>.colors(). The <i>color</i> must be specified as a string. If <i>color</i> is not specified, returns the scheme's alternative color, which defaults to `"#ccc"`.

<a name="values-categorical" href="#values-categorical">#</a> <i>categorical</i>.<b>values</b>(<i>function</i>) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/values.js "Source")

Sets the values accessor to the specified <i>function</i>, allowing the scheme to interact with a map's data. 

<i>function</i><br />
When the scheme is passed to <i>map</i>.drawScheme(), the <i>function</i> will be called for each datum in the map's data array, being passed the datum `d`, the index `i`, and the array `data` as three arguments. For example, if you want your scheme to be based on each subunit's party:

```js
var data = [
  {party: "Democratic", state: "California"},
  {party: "Republican", state: "Texas"},
  ...
];

scheme
  .data(data, d => d.state)
  .values(d => d.party);

map.drawScheme(scheme);
```

<a name="schemeSequential" href="#schemeSequential">#</a> swiftmap.<b>schemeSequential</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/schemeSequential.js "Source")

Sequential schemes are used to assign colors to discrete ranges in a series of values that progress from low to high.

```js
var scheme = swiftmap.schemeSequential()
  .data(JSON)
  .colors(["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"])
  .mode("q")
  .values(d => d.value);
```

[See it in action](https://bl.ocks.org/HarryStevens/4db2b695df4b02042bfa0c1ee6eac299).

<a name="data-sequential" href="#data-sequential">#</a> <i>sequential</i>.<b>data</b>([<i>data</i>[, <i>key</i>]]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/data.js "Source")

See [<i>categorical</i>.data()](#data-categorical).

<a name="colors-sequential" href="#colors-sequential">#</a> <i>sequential</i>.<b>colors</b>([<i>palette</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/colors.js "Source")

Specifies the series of colors to which values should be assigned.

<i>palette</i><br />
If a <i>palette</i> is specified, the scheme will assign a series of values to each color in the <i>palette</i>. The <i>palette</i> must be specified as an array of strings. If <i>palette</i> is not specified, returns the color palette associated with the scheme.

The <i>palette</i> will default to `["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"]` if this method is not called.

<a name="mode" href="#mode">#</a> <i>sequential</i>.<b>mode</b>([<i>breaktype</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/mode.js "Source")

Computes class breaks based on data.

<i>breaktype</i><br />
If a <i>breaktype</i> is specified, the scheme will compute the class breaks based on data. The <i>breaktype</i> must be specified as a string, either `"e"`, `"q"`, `"l"` or `"k"`.
- `"e"` specifies <b>equidistant</b> breaks, where each break spans an equal numeric range.
- `"l"` specifies <b>logarithmic</b> breaks, which are just like equidistant breaks but on a logarithmic scale.
- `"q"` specifies <b>quantile</b> breaks, where an equal number of data points is placed into each break.
- `"k"` specifies <b>k-means</b> breaks, which use a [<i>k</i>-means clustering](https://en.wikipedia.org/wiki/K-means_clustering) algorithm to group similar data points with each other.

The <i>breaktype</i> will default to `"q"` if this method is not called. If a <i>breaktype</i> is not specified, returns the <i>breaktype</i> associated with the scheme.

<a name="values-sequential" href="#values-sequential">#</a> <i>sequential</i>.<b>values</b>(<i>function</i>) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/values.js "Source")

Sets the values accessor to the specified <i>function</i>, allowing the scheme to interact with a map's data.

<i>function</i><br />
The <i>function</i> defaults to:

```js
d => d
```

When the scheme is passed to <i>map</i>.drawScheme(), the <i>function</i> will be called for each datum in the map's data array, being passed the datum `d`, the index `i`, and the array `data` as three arguments. The default <i>function</i> assumes that each input datum is a single number. If your data are in a different format, or if you wish to transform the data before rendering, then you should specify a custom accessor. For example, if you want your scheme to be based on each subunit's population density:

```js
var data = [
  {population: "15324", area: "124", county: "Foo"},
  {population: "23540", area: "365", county: "Bar"},
  ...
];

scheme
  .data(data, d => d.county)
  .values(d => +d.population / +d.area);

map.drawScheme(scheme);
```

<a name="schemeBubble" href="#schemeBubble">#</a> swiftmap.<b>schemeBubble</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/schemeBubble.js "Source")

Bubble schemes are used to map values of data to corresponding circles' radii.

```js
var scheme = swiftmap.schemeBubble()
  .data(JSON)
  .radiusRange([2, 20])
  .values(d => d.value);
```

[See it in action](https://bl.ocks.org/HarryStevens/ab09e52c2d513ae7e6aa783cbd9dc1c3).

<a name="data-bubble" href="#data-bubble">#</a> <i>bubble</i>.<b>data</b>([<i>data</i>[, <i>key</i>]]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/data.js "Source")

See [<i>categorical</i>.data()](#data-categorical).

<a name="radiusRange" href="#radiusRange">#</a> <i>bubble</i>.<b>radiusRange</b>([<i>range</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/radiusRange.js "Source")

Sets or gets the minimum and maximum radii of the bubble scheme.

<i>range</i><br />
If a <i>range</i> is specified, sets the minimum and maximum values of the bubbles' radii. If a <i>range</i> is not specified, returns the range associated with the scheme, which defaults to `[2, 20]`.

<a name="values-bubble" href="#values-bubble">#</a> <i>bubble</i>.<b>values</b>(<i>function</i>) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/values.js "Source")

See [<i>sequential</i>.values()](#values-sequential).

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

Swiftmap also uses a custom version of D3.js, which can be found in [`lib/swiftmap-d3-bundler`](https://github.com/HarryStevens/swiftmap/tree/master/lib/swiftmap-d3-bundler). If you need to update the bundle, do `cd lib/swiftmap-d3-bundler`, where you can install additional dependencies and update the [`index.js`](https://github.com/HarryStevens/swiftmap/blob/master/lib/swiftmap-d3-bundler/index.js) file. You will also have to update the `globals` object and the `only` array in the `resolve()` function in [`rollup.config.js`](https://github.com/HarryStevens/swiftmap/blob/master/rollup.config.js).