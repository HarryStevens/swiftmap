import isFunction from "../utils/isFunction";
import isNumber from "../utils/isNumber";
import isScheme from "../utils/isScheme";
import isString from "../utils/isString";
import * as d3 from "../../lib/d3";
import limits from "../../lib/chroma/limits";

export default (function(){
  var marginTop = 5,
      marginBottom = 0,
      marginLeft = 0,
      marginRight = 0,
      scheme = null,
      parent = null,
      selection = null,
      width = null,
      height = null,
      svg = null,
      circleCount = 3,
      circleBreaks = null,
      labelFormat = function(d){ return d; };
  
  function keyNested(str){
    parent = isString(str) ? str : "body";
    selection = d3.select(parent);
    width = +jz.str.keepNumber(selection.style("width")) - marginLeft - marginRight;
    height = +jz.str.keepNumber(selection.style("height")) - marginTop - marginBottom;
    return keyNested;
  }

  keyNested.marginTop = function(num){
    marginTop = isNumber(num) ? num : marginTop;
    keyNested.height();
    return arguments.length ? keyNested : marginTop;
  }

  keyNested.marginBottom = function(num){
    marginBottom = isNumber(num) ? num : marginBottom;
    keyNested.height();
    return arguments.length ? keyNested : marginBottom;
  }

  keyNested.height = function(num){
    return arguments.length ? (height = isNumber(num) ? num - marginTop - marginBottom : height, keyNested) : height;
  }

  keyNested.marginLeft = function(num){
    marginLeft = isNumber(num) ? num : marginLeft;
    keyNested.width();
    return arguments.length ? keyNested : marginLeft;
  }

  keyNested.marginRight = function(num){
    marginRight = isNumber(num) ? num : marginRight;
    keyNested.width();
    return arguments.length ? keyNested : marginRight;
  }

  keyNested.width = function(num){
    return arguments.length ? (width = isNumber(num) ? num - marginLeft - marginRight : width, keyNested) : width;
  }        

  keyNested.scheme = function(sch){
    return arguments.length ? (scheme = isScheme(sch) ? sch : scheme, keyNested) : scheme;
  }

  keyNested.circleCount = function(num){
    return arguments.length ? (circleCount = isNumber(num) ? num : circleCount, keyNested) : circleCount;
  }

  keyNested.labelFormat = function(fn){
    return arguments.length ? (labelFormat = isFunction(fn) ? fn : labelFormat, keyNested) : labelFormat;
  }

  keyNested.parent = function(){
    return parent;
  }

  keyNested.svg = function(){
    return svg;
  }

  keyNested.draw = function(){
    if (!svg){
      svg = selection.append("svg")
          .attr("width", width + marginLeft + marginRight)
          .attr("height", height + marginTop + marginBottom)
        .append("g")
          .attr("transform", "translate(" + marginLeft + ", " + marginTop + ")");
    }

    var dataBreaks = limits(scheme.data().map(scheme.from()), "q", circleCount - 1);
    var circleBreaks = limits(scheme.to(), "q", circleCount - 1);
    var maxData = dataBreaks[dataBreaks.length - 1];
    var scale = d3.scaleLinear()
        .range(circleBreaks)
        .domain(dataBreaks);

    var legend_text_left_pad = 8;
    
    var legend_circle = svg.selectAll(".legend-circle")
        .data(dataBreaks)
      .enter().append("circle")
        .attr("class", "legend-circle")
        .attr("cy", function(d){ return scale(d) + 1; })
        .attr("cx", scale(maxData) + 1)
        .attr("r", function(d){ return scale(d); })

    var legend_dotted_line = svg.selectAll(".legend-dotted-line")
        .data(dataBreaks)
      .enter().append("line")
        .attr("class", "legend-dotted-line")
        .attr("x1", scale(maxData) + 1)
        .attr("x2", scale(maxData) * 2 + legend_text_left_pad)
        .attr("y1", function(d){ return scale(d) * 2 + 1; })
        .attr("y2", function(d){ return scale(d) * 2 + 1; });

    var legend_number = svg.selectAll(".legend-number")
        .data(dataBreaks)
    
    legend_number.enter().append("text")
        .attr("class", "legend-number")
        .attr("x", scale(maxData) * 2 + legend_text_left_pad)
        .attr("y", function(d){ return scale(d) * 2; })
        .attr("dy", ".38em")
      .merge(legend_number)
        .text(labelFormat);

    return keyNested;
  }

  return keyNested;
})();