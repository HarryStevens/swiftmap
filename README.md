# swiftmap
A simple API for making awesome maps. [See it in action](https://bl.ocks.org/harrystevens/5b705c13618e20706675135fd412b6d1).

## Features

Provides a simple API for making maps.

```js
var map = swiftmap.init().geometry(TopoJSONObject).draw();
```

Exposes DOM elements as D3 selections for styling.

```js
var colors = ["red", "orange", "yellow", "green", "blue", "purple"];
map.subunits.style("fill", (d, i) => colors[i % colors.length] );
```

Makes it easy to create resizable maps for responsive designs.

```js
window.onresize = () => map.resize();
```

Allows for chaining functions.

```js
map.fitSize().drawBoundary();
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

- [Initializing a Map](#initializing-a-map)
- [Drawing a Map](#drawing-a-map)
- [Schemes](#schemes)

### Initializing a Map

Before drawing and styling a map, you must tell swiftmap where on the DOM to place the map, as well as the geospatial data to use for the map.

<a name="init" href="#init">#</a> swiftmap.<b>init</b>([<i>parent</i>]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/init/init.js "Source")

Initializes a <i>map</i>. If <i>parent</i> is specified, the <i>map</i> will be placed in the DOM element referenced by the parent's selector. The <i>parent</i> must be specified as a string. If <i>parent</i> is not specified, `"body"` will be used as the parent.

<a name="geometry" href="#geometry">#</a> <i>map</i>.<b>geometry</b>([<i>data</i>[, <i>key</i>]]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/init/geometry.js "Source")

Adds geospatial data to the <i>map</i>. The <i>data</i> must be specified as a TopoJSON object. If no <i>data</i> is passed, returns the current geospatial data associated with the <i>map</i>. Swiftmap cannot draw a map without geospatial data.

Each datum will be assigned a key value based on the value returned by an optional <i>key</i> function. This key will be used to match each datum of geospatial data to a corresponding datum of tabular data. If no <i>key</i> is specified, each datum will be assigned a key according to its index.

<a name="data" href="#data">#</a> <i>map</i>.<b>data</b>([<i>data</i>[, <i>key</i>]]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/init/data.js "Source")

Adds tabular data to the <i>map</i>. The <i>data</i> must be specified as a JSON array. If no <i>data</i> is passed, returns the current tabular data associated with the <i>map</i>.

Each datum will be assigned a key value based on the value returned by an optional <i>key</i> function. This key will be used to match each datum of tabular data to a corresponding datum of geospatial data. If no <i>key</i> is specified, each datum will be assigned a key according to its index.

<b>Initial attributes</b>

<a name="height" href="#height">#</a> <i>map</i>.<b>height</b><br />
<a name="width" href="#width">#</a> <i>map</i>.<b>width</b>

The map's dimensions.

<a name="svg" href="#svg">#</a> <i>map</i>.<b>svg</b>

The D3 selection of the SVG element containing the map.

<a name="parent" href="#parent">#</a> <i>map</i>.<b>parent</b>

A string of the map's parent element.

<a name="path" href="#path">#</a> <i>map</i>.<b>path</b>()

The GeoJSON path of the map. See [the documentation in d3-geo](https://github.com/d3/d3-geo#_path).

<a name="projection" href="#projection">#</a> <i>map</i>.<b>projection</b>()

The projection used to render the map. For now, only the Mercator projection is supported. See [the documentation in d3-geo](https://github.com/d3/d3-geo#projections).

### Drawing a Map

Once a <i>map</i> has been initialized, swiftmap provides several of methods for drawing.

<a name="draw" href="#draw">#</a> <i>map</i>.<b>draw</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/draw/draw.js "Source")

Draws a map. This is a convenience method equivalent to <i>map</i>.<b>fitSize</b>().<b>drawSubunits</b>().<b>drawBoundary</b>().

<a name="drawBoundary" href="#drawBoundary">#</a> <i>map</i>.<b>drawBoundary</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/draw/drawBoundary.js "Source")

Draws the map's outer boundary.

<a name="drawSubunits" href="#drawSubunits">#</a> <i>map</i>.<b>drawSubunits</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/draw/drawSubunits.js "Source")

Draws the map's subunits. For example, if your TopoJSON contains states, the subunits are the states.

<a name="fill" href="#fill">#</a> <i>map</i>.<b>fill</b>(scheme[, duration]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/draw/fill.js "Source")

Fills the map's subunits based on a [<i>scheme</i>](#schemes). An optional <i>duration</i> may be specified to enable an animated transition from the current fill to the new fill. The <i>duration</i> must be specified as a positive number corresponding to the length of the transition in milliseconds. [See it in action](https://bl.ocks.org/HarryStevens/4db2b695df4b02042bfa0c1ee6eac299).

<a name="fitSize" href="#fitSize">#</a> <i>map</i>.<b>fitSize</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/draw/fitSize.js "Source")

Updates the projection so that the map's outer boundary fits its parent element.

<a name="resize" href="#resize">#</a> <i>map</i>.<b>resize</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/draw/resize.js "Source")

Resizes the map. This method is useful if your map must respond to window resizes.

<b>Draw attributes</b>

<a name="boundary" href="#boundary">#</a> <i>map</i>.<b>boundary</b><br />
<a name="subunits" href="#subunits">#</a> <i>map</i>.<b>subunits</b>

[D3 selections](https://github.com/d3/d3-selection) of the map's boundary and subunits. These attributes are only available after calling <i>map</i>.<b>drawBoundary</b>(), <i>map</i>.<b>drawSubunits</b>(), or <i>map</i>.<b>draw</b>(), which makes both available.

```js
map.subunits
    .style("stroke-width", (d, i) => (i / 4) + "px" )
```

<b>Draw styles</b>

Maps rendered with swiftmap can be styled with CSS. The boundary is exposed as the class `boundary`, and the subunits are exposed as the class `subunit`.

### Schemes

Schemes provide an interface for mapping attributes of your data to visual attributes. Typically, you will use a scheme to create a thematic map, such as a choropleth map.

<a name="schemeSequential" href="#schemeSequential">#</a> swiftmap.<b>schemeSequential</b>() [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/schemeSequential.js "Source")

Sequential schemes are used to assign colors to discrete ranges in a series of values that progress from low to high.

```js
var scheme = swiftmap.schemeSequential()
  .colors(["#ffffe5", "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#005a32"])
  .mode("q")
  .values(d => +d.population / +d.area);
```

[See it in action](https://bl.ocks.org/HarryStevens/4db2b695df4b02042bfa0c1ee6eac299).

<a name="colors" href="#colors">#</a> <i>sequential</i>.<b>colors</b>([palette]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/colors.js "Source")

If a <i>palette</i> is specified, the scheme will assign a series of values to each color in the <i>palette</i>. The <i>palette</i> must be specified as an array of strings. If <i>palette</i> is not specified, returns the current color palette associated with the scheme.

The <i>palette</i> will default to `["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"]` if this method is not called.

<a name="mode" href="#mode">#</a> <i>sequential</i>.<b>mode</b>([breaktype]) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/mode.js "Source")

If a <i>breaktype</i> is specified, the scheme will compute the class breaks based on data. The <i>breaktype</i> must be specified as a string, either "e", "q", "l" or "k".
- "e" specifies <b>equidistant</b> breaks, where each break spans an equal numeric range.
- "l" specifies <b>logarithmic</b> breaks, which are just like equidistant breaks but on a logarithmic scale.
- "q" specifies <b>quantile</b> breaks, where an equal number of data points is placed into each break.
- "k" specifies <b>k-means</b> breaks, which use a [<i>k</i>-means clustering](https://en.wikipedia.org/wiki/K-means_clustering) algorithm to group similar data points with each other.

If a <i>breaktype</i> is not specified, returns the <i>breaktype</i> associate with the scheme.

The <i>breaktype</i> will default to "q" if this method is not called.

<a name="values" href="#values">#</a> <i>sequential</i>.<b>values</b>(function) [<>](https://github.com/HarryStevens/swiftmap/tree/master/src/scheme/values.js "Source")

Allows the scheme to interact with the map's data. The <i>function</i> tells the scheme which value from each of the map's subunit should correspond to the scheme.

## Contributing

```bash
git clone https://github.com/HarryStevens/swiftmap # clone this repository
cd swiftmap # navigate into the directory
npm install # install node modules
```

swiftmap is compiled with [rollup](https://github.com/rollup/rollup). Each function can be found in the [`src` directory](https://github.com/HarryStevens/swiftmap/tree/master/lib).

```bash
npm run rollup # compile the library
npm run minify # minify the library
npm run build # compile and minify the library
```

swiftmap also uses a custom version of D3.js, which can be found in [`lib/swiftmap-d3-bundler`](https://github.com/HarryStevens/swiftmap/tree/master/lib/swiftmap-d3-bundler). If you need to update the bundle, do `cd lib/swiftmap-d3-bundler`, where you can install additional dependencies and update the [`index.js`](https://github.com/HarryStevens/swiftmap/blob/master/lib/swiftmap-d3-bundler/index.js) file. You will also have to update the `globals` object and the `only` array in the `resolve()` function in [`rollup.config.js`](https://github.com/HarryStevens/swiftmap/blob/master/rollup.config.js).