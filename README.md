# swiftmap
A super simple API for making super simple maps.

## <a name="examples" href="#example">Examples</a>

Initialize and draw a map.

```js
swiftmap.init({ data: topoJsonArray }).draw();
```

Chain functions.

```js
var map = swiftmap.init({ data: topoJsonArray });

map.centerZoom().drawBoundary();
```

Resize the map.

```js
window.addEventListener("resize", function(){
  map.resize();
});
```

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

<a name="init" href="#init">#</a> swiftmap.<b>init</b>(<i>options</i>)

Initializes a <i>map</i>.

| option  | required | datatype | default  | description                                                        | 
|---------|----------|----------|----------|--------------------------------------------------------------------|
| data    | TRUE     | object   | none     | A TopoJSON object with the map's geometry.                         | 
| wrapper | FALSE    | string   | `"body"` | The DOM selector in which to place the map. For example, `"#map"`. | 

<a name="draw" href="#draw">#</a> <i>map</i>.<b>draw</b>()

Draws a map. This is a convenience method equivalent to <i>map</i>.<b>centerZoom</b>().<b>drawSubUnits</b>().<b>drawBoundary</b>().

<a name="centerZoom" href="#centerZoom">#</a> <i>map</i>.<b>centerZoom</b>()

Centers and zooms the map so that its outer boundary fits its wrapper element.

<a name="drawBoundary" href="#drawBoundary">#</a> <i>map</i>.<b>drawBoundary</b>()

Draws the map's outer boundary.

<a name="drawSubunits" href="#drawSubunits">#</a> <i>map</i>.<b>drawSubunits</b>()

Draws the map's subunits. For example, if your TopoJSON contains states, the subunits are the states.

<a name="resize" href="#resize">#</a> <i>map</i>.<b>resize</b>()

Resizes the map. This method is useful if your map must respond to window resizes.

### Attributes

<a name="height" href="#height">#</a> <i>map</i>.<b>height</b><br />
<a name="width" href="#width">#</a> <i>map</i>.<b>width</b>

The map's dimensions.

<a name="boundary" href="#boundary">#</a> <i>map</i>.<b>boundary</b><br />
<a name="subUnits" href="#subUnits">#</a> <i>map</i>.<b>subUnits</b>

D3 selections of the map's boundary and subunits. These attributes are only available after calling <i>map</i>.<b>drawBoundary</b>(), <i>map</i>.<b>drawSubunits</b>(), or <i>map</i>.<b>draw</b>(), which makes both available.

```js
map.subUnits
    .style("stroke-width", function(d, i){ return (i / 4) + "px"; })
```

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