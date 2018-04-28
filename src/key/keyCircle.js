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
      labelTop = 0,
      data = [],
      styles = [],
      attrs = [],
      radius = 5,
      labelText = [],
      text = null,
      scale = d3.scaleBand().rangeRound([0, orientation == "horizontal" ? width : height]).domain(data);

  function keyCircle(str, arr){
    parent = isString(str) ? str : "body";
    selection = d3.select(parent);
    width = +jz.str.keepNumber(selection.style("width")) - marginLeft - marginRight;
    height = +jz.str.keepNumber(selection.style("height")) - marginTop - marginBottom;
    return arguments.length ? (parent, keyCircle) : parent;
  }

  keyCircle.orientation = function(str){
    orientation = isString(str) && (str.toLowerCase() == "horizontal" || str.toLowerCase() == "vertical") ? str : orientation;
    scale.rangeRound([0, orientation == "horizontal" ? width : height]);
    return arguments.length ? (orientation, keyCircle) : orientation;
  }

  keyCircle.marginTop = function(num){
    marginTop = isNumber(num) ? num : marginTop;
    keyCircle.height();
    return arguments.length ? (marginTop, keyCircle) : marginTop;
  }

  keyCircle.marginBottom = function(num){
    marginBottom = isNumber(num) ? num : marginBottom;
    keyCircle.height();
    return arguments.length ? (marginBottom, keyCircle) : marginBottom;
  }

  keyCircle.height = function(num){
    height = isNumber(num) ? num - marginTop - marginBottom : height;
    scale.rangeRound([0, orientation == "horizontal" ? width : height]);
    return arguments.length ? (height, keyCircle) : height;
  }

  keyCircle.marginLeft = function(num){
    marginLeft = isNumber(num) ? num : marginLeft;
    keyCircle.width();
    return arguments.length ? (marginLeft, keyCircle) : marginLeft;
  }

  keyCircle.marginRight = function(num){
    marginRight = isNumber(num) ? num : marginRight;
    keyCircle.width();
    return arguments.length ? (marginRight, keyCircle) : marginRight;
  }

  keyCircle.width = function(num){
    width = isNumber(num) ? num - marginLeft - marginRight : width;
    scale.rangeRound([0, orientation == "horizontal" ? width : height]);
    return arguments.length ? (width, keyCircle) : width;
  }

  keyCircle.radius = function(num){
    radius = isNumber(num) ? num : radius;
    return arguments.length ? (radius, keyCircle) : radius;
  }

  keyCircle.data = function(arr){
    data = isArray(arr) ? arr : data;
    labelText = data;
    scale.domain(data);
    return arguments.length ? (data, keyCircle) : data;
  }

  keyCircle.circles = function(){
    return circles;
  }

  keyCircle.labelText = function(arr){
    labelText = isArray(arr) ? arr : labelText;
    return arguments.length ? (labelText, keyCircle) : labelText;
  }

  keyCircle.labelLeft = function(num){
    labelLeft = isNumber(num) ? num : labelLeft;
    return arguments.length ? (labelLeft, keyCircle) : labelLeft;
  }

  keyCircle.labelTop = function(num){
    labelTop = isNumber(num) ? num : labelTop;
    return arguments.length ? (labelTop, keyCircle) : labelTop;
  }

  keyCircle.style = function(str, val){
    styles.push({
      style: isString(str) ? str : null,
      value: val
    });

    return keyCircle;
  }

  keyCircle.attr = function(str, val){
    if (str == "r") radius = val;
    attrs.push({
      attr: isString(str) ? str : null,
      value: val
    });

    return keyCircle;
  }

  keyCircle.styles = function(){
    return styles;
  }

  keyCircle.draw = function(){
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

    circles.enter().append("circle")
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
        .text(function(d, i){ return labelText[i]; });

    return keyCircle;
  }

  return keyCircle;
})();