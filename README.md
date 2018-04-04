# swiftmap
A super simple API for making super simple maps. [See it in action](https://bl.ocks.org/harrystevens/5b705c13618e20706675135fd412b6d1).

## <a name="features" href="#features">Features</a>

Provides an insanely simple API for initializing and drawing maps.

```js
var map = swiftmap.init().dataGeo(TopoJSONObject).draw();
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

## <a name="installation" href="#installation">Installation</a>

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

## <a name="api" href="#api">API</a>

### Methods

<a name="init" href="#init">#</a> swiftmap.<b>init</b>([<i>wrapper</i>])

Initializes a <i>map</i>. If <i>wrapper</i> is specified, the <i>map</i> will be placed in the DOM element referenced by the wrapper's selector. The <i>wrapper</i> must be specified as a string. If <i>wrapper</i> is not specified, `"body"` will be used as the wrapper.

<a name="dataGeo" href="#dataGeo">#</a> <i>map</i>.<b>dataGeo</b>(<i>data</i>)

Adds geospatial data the the <i>map</i>. The <i>data</i> must be a TopoJSON object. 

<a name="draw" href="#draw">#</a> <i>map</i>.<b>draw</b>()

Draws a map. This is a convenience method equivalent to <i>map</i>.<b>fitSize</b>().<b>drawSubunits</b>().<b>drawBoundary</b>().

<a name="drawBoundary" href="#drawBoundary">#</a> <i>map</i>.<b>drawBoundary</b>()

Draws the map's outer boundary.

<a name="drawSubunits" href="#drawSubunits">#</a> <i>map</i>.<b>drawSubunits</b>()

Draws the map's subunits. For example, if your TopoJSON contains states, the subunits are the states.

<a name="fitSize" href="#fitSize">#</a> <i>map</i>.<b>fitSize</b>()

Updates the projection so that the map's outer boundary fits its wrapper element.

<a name="resize" href="#resize">#</a> <i>map</i>.<b>resize</b>()

Resizes the map. This method is useful if your map must respond to window resizes.

### Attributes

<a name="height" href="#height">#</a> <i>map</i>.<b>height</b><br />
<a name="width" href="#width">#</a> <i>map</i>.<b>width</b>

The map's dimensions.

<a name="boundary" href="#boundary">#</a> <i>map</i>.<b>boundary</b><br />
<a name="subunits" href="#subunits">#</a> <i>map</i>.<b>subunits</b>

D3 selections of the map's boundary and subunits. These attributes are only available after calling <i>map</i>.<b>drawBoundary</b>(), <i>map</i>.<b>drawSubunits</b>(), or <i>map</i>.<b>draw</b>(), which makes both available.

```js
map.subunits
    .style("stroke-width", (d, i) => (i / 4) + "px" )
```

<a name="svg" href="#svg">#</a> <i>map</i>.<b>svg</b>

The D3 selection of the SVG element containing the map.

<a name="wrapper" href="#wrapper">#</a> <i>map</i>.<b>wrapper</b>

A string of the map's wrapper element.

<a name="path" href="#path">#</a> <i>map</i>.<b>path</b>()

The GeoJSON path of the map. See [the documentation in d3-geo](https://github.com/d3/d3-geo#_path).

<a name="projection" href="#projection">#</a> <i>map</i>.<b>projection</b>()

The projection used to render the map. For now, only the Mercator projection is supported. See [the documentation in d3-geo](https://github.com/d3/d3-geo#projections).

### Styles

Maps rendered with swiftmap can be styled with CSS. The boundary is exposed as the class `boundary`, and the subunits are exposed as the class `subunit`.

## <a name="contributing" href="#contributing">Contributing</a>

swiftmap is compiled with [rollup](https://github.com/rollup/rollup). Each function can be found in the [`src` directory](https://github.com/HarryStevens/swiftmap/tree/master/lib).

```bash
npm run rollup # compile the library
npm run minify # minify the library
npm run build # compile and minify the library
```