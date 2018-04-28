import * as d3 from "../../lib/d3";
import isFunction from "../utils/isFunction";
import isNumber from "../utils/isNumber";
import isString from "../utils/isString";

// Draws raster tiles to a map's background.
export default function drawTiles(swiftmap){
  // Functions to pull tiles from various providers.
  // See documentation for copyrights: https://github.com/HarryStevens/swiftmap#tiles
  var types = {
    openStreetMap: function(d){ return "http://" + "abc"[d.y % 3] + ".tile.openstreetmap.org/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenToner: function(d){ return "http://tile.stamen.com/toner/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenTerrain: function(d){ return "http://tile.stamen.com/terrain/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenTerrainLabels: function(d){ return "http://tile.stamen.com/terrain-labels/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenTerrainNoLabels: function(d){ return "http://tile.stamen.com/terrain-background/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenWatercolor: function(d){ return "http://tile.stamen.com/watercolor/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    mapboxNaturalEarth: function(d){ return "https://a.tiles.mapbox.com/v3/mapbox.natural-earth-2/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoLight: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/light_all/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoDark: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/dark_all/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoLightNoLabels: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/light_nolabels/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoLightLabels: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/light_only_labels/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoDarkLabels: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/dark_only_labels/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    wikimedia: function(d){ return "https://maps.wikimedia.org/osm-intl/" + d.z + "/" + d.x + "/" + d.y + ".png"; }
  }

  var pi = Math.PI,
      tau = 2 * pi;

  // The d3-tile module computes the tiles' properties.
  var tiles = d3.tile()
    .size([swiftmap.width, swiftmap.height])
    .scale(swiftmap.meta.projection.function.scale() * tau)
    .translate(swiftmap.meta.projection.function([0, 0]))
    .wrap(true)
    .extent([[0, 0], [swiftmap.width, swiftmap.height]]);

  // SVG has no z-index, so this is required to keep entering and updating tiles in the background.
  d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
      var firstChild = this.parentNode.firstChild;
      if (firstChild) {
        this.parentNode.insertBefore(this, firstChild);
      }
    });
  };

  // General update pattern for the tile images.
  var tiles_element = swiftmap.svg.selectAll(".tile")
      .data(tiles(), function(d, i){ return i; });
  
  tiles_element.exit().remove();  

  tiles_element.enter().append("image")
      .attr("class", "tile")
    .merge(tiles_element)
      .attr("x", function(d) { return (d.x + tiles().translate[0]) * tiles().scale; })
      .attr("y", function(d) { return (d.y + tiles().translate[1]) * tiles().scale; })
      .attr("width", tiles().scale)
      .attr("height", tiles().scale)
      .attr("xlink:href", isFunction(swiftmap.meta.tiles) ? swiftmap.meta.tiles : types[swiftmap.meta.tiles])
      .moveToBack();

  return swiftmap;
}