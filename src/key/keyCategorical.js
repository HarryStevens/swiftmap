import isArray from "../utils/isArray";
import isFunction from "../utils/isFunction";
import isNumber from "../utils/isNumber";
import isString from "../utils/isString";
import * as d3 from "../../lib/d3";

export default (function(){
	var marginTop = 0,
      marginBottom = 0,
      marginLeft = 0,
      marginRight = 0,
      parent = null,
      selection = null,
      width = null,
      height = null,
      svg = null,
      orientation = "horizontal",
      circles = null,
      labels = null,
      labelLeft = 5,
      labelTop = 1,
      data = [],
      styles = [],
      attrs = [],
      radius = 6,
      labelText = [],
      labelFormat = function(d){ return d; },
      text = null,
      shape = "rect",
      scale = d3.scaleBand().rangeRound([0, orientation == "horizontal" ? width : height]).domain(data);

  function keyCategorical(str){
    parent = isString(str) ? str : "body";
    selection = d3.select(parent);
    width = +jz.str.keepNumber(selection.style("width")) - marginLeft - marginRight;
    height = +jz.str.keepNumber(selection.style("height")) - marginTop - marginBottom;
    return keyCategorical;
  }

  keyCategorical.shape = function(str){
    return arguments.length ? (shape = isString(str) ? str : shape, keyCategorical) : shape;
  }

  keyCategorical.orientation = function(str){
    orientation = isString(str) && (str.toLowerCase() == "horizontal" || str.toLowerCase() == "vertical") ? str : orientation;
    scale.rangeRound([0, orientation == "horizontal" ? width : height]);
    return arguments.length ? keyCategorical : orientation;
  }

  keyCategorical.marginTop = function(num){
    marginTop = isNumber(num) ? num : marginTop;
    keyCategorical.height();
    return arguments.length ? keyCategorical : marginTop;
  }

  keyCategorical.marginBottom = function(num){
    marginBottom = isNumber(num) ? num : marginBottom;
    keyCategorical.height();
    return arguments.length ? keyCategorical : marginBottom;
  }

  keyCategorical.height = function(num){
    height = isNumber(num) ? num - marginTop - marginBottom : height;
    scale.rangeRound([0, orientation == "horizontal" ? width : height]);
    return arguments.length ? keyCategorical : height;
  }

  keyCategorical.marginLeft = function(num){
    marginLeft = isNumber(num) ? num : marginLeft;
    keyCategorical.width();
    return arguments.length ? keyCategorical : marginLeft;
  }

  keyCategorical.marginRight = function(num){
    marginRight = isNumber(num) ? num : marginRight;
    keyCategorical.width();
    return arguments.length ? keyCategorical : marginRight;
  }

  keyCategorical.width = function(num){
    width = isNumber(num) ? num - marginLeft - marginRight : width;
    scale.rangeRound([0, orientation == "horizontal" ? width : height]);
    return arguments.length ? keyCategorical : width;
  }

  keyCategorical.radius = function(num){
    return arguments.length ? (radius = isNumber(num) ? num : radius, keyCategorical) : radius;
  }

  keyCategorical.data = function(arr){
    data = isArray(arr) ? arr : data;
    labelText = data;
    scale.domain(data);
    return arguments.length ? (data, keyCategorical) : data;
  }

  keyCategorical.circles = function(){
    return circles;
  }

  keyCategorical.labelText = function(arr){
    return arguments.length ? (labelText = isArray(arr) ? arr : labelText, keyCategorical) : labelText;
  }

  keyCategorical.labelText = function(arr){
    return arguments.length ? (labelText = isArray(arr) ? arr : labelText, keyCategorical) : labelText;
  }

  keyCategorical.labelFormat = function(fn){
    return arguments.length ? (labelFormat = isFunction(fn) ? fn : labelFormat, keyCategorical) : labelFormat;
  }

  keyCategorical.labelLeft = function(num){
    return arguments.length ? (labelLeft = isNumber(num) ? num : labelLeft, keyCategorical) : labelLeft;
  }

  keyCategorical.labelTop = function(num){
    return arguments.length ? (labelTop = isNumber(num) ? num : labelTop, keyCategorical) : labelTop;
  }

  keyCategorical.parent = function(){
    return parent;
  }

  keyCategorical.svg = function(){
    return svg;
  }

  keyCategorical.style = function(str, val){
    styles.push({
      style: isString(str) ? str : null,
      value: val
    });

    return keyCategorical;
  }

  keyCategorical.attr = function(str, val){
    if (str == "r") radius = val;
    attrs.push({
      attr: isString(str) ? str : null,
      value: val
    });

    return keyCategorical;
  }

  keyCategorical.styles = function(){
    return styles;
  }

  keyCategorical.draw = function(){
    if (!svg){
      svg = selection.append("svg")
          .attr("width", width + marginLeft + marginRight)
          .attr("height", height + marginTop + marginBottom)
        .append("g")
          .attr("transform", "translate(" + marginLeft + ", " + marginTop + ")");
    }

    var styles_obj = {};
    styles.forEach(function(style){
      styles_obj[style.style] = style.value;
    });

    var attrs_obj = {};
    attrs.forEach(function(attr){
      attrs_obj[attr.attr] = attr.value;
    });
    attrs_obj.r = radius;

    var stroke = Object.keys(styles_obj).indexOf("stroke") === -1 ? 0 : Object.keys(styles_obj).indexOf("stroke-width") === -1 ? 1 : styles_obj["stroke-width"];
    attrs_obj.cx = orientation == "vertical" ? radius + stroke : function(d){ return scale(d) + radius + stroke; };
    attrs_obj.cy = orientation == "vertical" ? function(d){ return scale(d) + radius + stroke; } : radius + stroke;

    circles = svg.selectAll(".key-circle")
        .data(data, function(d, i){ return i; });

    circles.enter().append(shape)
        .attr("class", function(d, i){ return "key-circle key-circle-" + i; })
      .merge(circles)
        .attrs(attrs_obj)
        .styles(styles_obj);

    var txt = svg.selectAll(".key-label")
        .data(data, function(d, i){ return i; });

    txt.enter().append("text")
        .attr("class", function(d, i){ return "key-label key-label-" + i; })
      .merge(txt)
        .attr("x", orientation == "vertical" ? (radius * 2) + (stroke * 2) + labelLeft : function(d){ return scale(d) + (radius * 2) + (stroke * 2) + labelLeft; })
        .attr("y", orientation == "vertical" ? function(d){ return scale(d) + radius + stroke + labelTop; } : radius + stroke + labelTop)
        .attr("dy", ".3em")
        .text(labelFormat);

    return keyCategorical;
  }

  return keyCategorical;
})();