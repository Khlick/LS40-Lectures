/* global d3 */

var base = {};

base.soho = {};

base.soho.WIDTH = 600;
base.soho.HEIGHT = 560;

base.soho.init = function() {
  'use strict';
  //Import the svg
  d3.xml("img/london_soho-slide.svg").mimeType("image/svg+xml").get(function(error, xml) {
    if (error) throw error;
    var importedNode = document.importNode(xml.documentElement, true);
  //add it to the D3 scene
  d3.select('Body').node().appendChild(importedNode)
  base.soho.svg = d3.selectAll("svg")
  base.soho.svg
    .attr('width', base.soho.WIDTH)
    .attr('height', base.soho.HEIGHT)

  base.soho.svg.select("#nearest")
     .attr("opacity", 0)
  });
};

base.soho.zoomout = function(){
  base.soho.svg = d3.selectAll("svg")
  base.soho.svg
    .transition()
    .duration(500)
    .attr('viewBox', "45 55 1900 1700");

  base.soho.svg.selectAll("#workhouse, #brewery")
    .style("fill", "#BFBFBF");
};

base.soho.zoomin = function(){
  base.soho.svg = d3.selectAll("svg")
  base.soho.svg
    .transition()
    .duration(500)
    .attr('viewBox', "730 500 600 600");

  base.soho.svg.selectAll("#workhouse, #brewery")
    .style("fill", "#BFBFBF");
};

base.soho.highligth_bg = function(){
  base.soho.svg = d3.selectAll("svg")
  base.soho.svg.selectAll("#workhouse, #brewery")
    .style("fill", "#FCECBEFF");
};

base.soho.init();

var _transitions = [
  {
    transitionForward: () => base.soho.zoomin(),
    index: 0 // will be run at the data-fragment-index=0 state
  },
  {
    transitionForward: () => base.soho.highligth_bg(),
    transitionBackward: () => base.soho.zoomout(), // different behavior on the way back
    index: 1 // will be run at the data-fragment-index=3 state
  },
]
