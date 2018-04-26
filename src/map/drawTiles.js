import isString from "../utils/isString";
import isNumber from "../utils/isNumber";
import * as d3 from "../../lib/d3";

export default function drawTiles(swiftmap){
  swiftmap = swiftmap;

  var types = {
    openStreetMap: function(d){ return "http://" + "abc"[d.y % 3] + ".tile.openstreetmap.org/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenToner: function(d){ return "http://tile.stamen.com/toner/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenTerrain: function(d){ return "http://tile.stamen.com/terrain/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenTerrainLabels: function(d){ return "http://tile.stamen.com/terrain-labels/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenTerrainNoLabels: function(d){ return "http://tile.stamen.com/terrain-background/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    stamenWatercolor: function(d){ return "http://tile.stamen.com/watercolor/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    mapboxNaturalEarth: function(d){return "https://a.tiles.mapbox.com/v3/mapbox.natural-earth-2/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoLight: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/light_all/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoDark: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/dark_all/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoLightNoLabels: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/light_nolabels/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoLightLabels: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/light_only_labels/" + d.z + "/" + d.x + "/" + d.y + ".png"; },
    cartoDarkLabels: function(d){ return "https://cartodb-basemaps-" + "abcd"[d.y % 4] + ".global.ssl.fastly.net/dark_only_labels/" + d.z + "/" + d.x + "/" + d.y + ".png"; }
  }

  var pi = Math.PI,
    tau = 2 * pi;

  var tiles = d3.tile()
    .size([swiftmap.width, swiftmap.height])
    .scale(swiftmap.meta.projection.function.scale() * tau)
    .translate(swiftmap.meta.projection.function([0, 0]))
    .wrap(true)
    .extent([[0, 0], [swiftmap.width, swiftmap.height]]);

  var tiles_element = swiftmap.svg.selectAll(".tile")
      .data(tiles(), function(d, i){ return i; })
  
  tiles_element.exit().remove();  

  tiles_element.enter().append("image")
      .attr("class", "tile")
    .merge(tiles_element)
      .attr("x", function(d) { return (d.x + tiles().translate[0]) * tiles().scale; })
      .attr("y", function(d) { return (d.y + tiles().translate[1]) * tiles().scale; })
      .attr("width", tiles().scale)
      .attr("height", tiles().scale)
      .attr("xlink:href", types[swiftmap.meta.tiles]);

  tiles_element.moveToBack = function() {
    return this.each(function() {
      var firstChild = this.parentNode.firstChild;
      if (firstChild) {
        this.parentNode.insertBefore(this, firstChild);
      }
    });
  };

  tiles_element.moveToBack();

  return swiftmap;
}