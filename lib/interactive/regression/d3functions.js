var drawline = function(data){

  var xValues = data.map(function(d){return d.x;});
  var yValues = data.map(function(d){return d.y;});
  var lsCoef = [LeastSquares(xValues, yValues)];

  var lineFunction = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

  svg
    .append('path')
    .attr("d", lineFunction([{"x": 50, "y": lsCoef[0].m * 50 + lsCoef[0].b},{"x": 450, "y": lsCoef[0].m * 450 + lsCoef[0].b}]))
    .attr("stroke-width", 2)
    .attr("stroke", "#E04B4B")
    .attr('id', 'regline');
}

var transitionline = function(data){
  var xValues = data.map(function(d){return d.x;});
  var yValues = data.map(function(d){return d.y;});
  var lsCoef = [LeastSquares(xValues, yValues)];

  var lineFunction = d3.svg.line()
  .x(function(d) { return d.x; })
  .y(function(d) { return d.y; });
  
  d3.select('#regline')
    .transition()
    .attr('d', lineFunction([{"x": 50, "y": lsCoef[0].m * 50 + lsCoef[0].b},{"x": 450, "y": lsCoef[0].m * 450 + lsCoef[0].b}]));


}

var drawresiduals = function(data){
//get least squares coeffs, great dotted red paths
  var xValues = data.map(function(d){return d.x;});
  var yValues = data.map(function(d){return d.y;});
  var lsCoef = [LeastSquares(xValues, yValues)];

  var lineFunction = d3.svg.line()
    .y(function(d) { return d.y;
    })
    .x(function(d) { return d.x; });


  var resids = data.map(function(d){
    return {"x0": d.x, "y0": d.y, "x1": d.x , "y1": lsCoef[0].m * d.x + lsCoef[0].b}
})

  var halfcircles = function(d){
    var radius = r(200),
      padding = 10,
      radians = Math.PI;

    var dimension = (2 * radius) + (2 * padding),
        points = 50;



    var angle = d3.scale.linear()
        .domain([0, points-1])
        .range([ 0, radians]);

    var fullangle = d3.scale.linear()
        .domain([0, points-1])
        .range([ 0, 2*radians]);

    var line = d3.svg.line.radial()
        .interpolate("basis")
        .tension(0)
        .radius(radius)
        .angle(function(e, i) { 
          if(d.y0-d.y1 < -r(200)) {
            return angle(i) + Math.PI/2; 
          } else if (d.y0 - d.y1 > r(200)){
            return angle(i) + Math.PI*(3/2);
          } else {
            return fullangle(i);
          }
        })


    svg.append("path").datum(d3.range(points))
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", 'none')
        .attr("transform", "translate(" + (d.x0) + ", " + (d.y0) + ")")
        .style("stroke-dasharray", ("1, 1"))
        .style("stroke", function(e){
          if(d.y0-d.y1 > -r(200) && d.y0 - d.y1 < r(200)){
            return "green";

          } else {

            return "red";
          }
        })
        .attr("class", "halfcirc");
    }


  svg.selectAll('path.resline').remove();
  svg.selectAll('path.halfcirc').remove();
  var selection = svg.selectAll('.resline').data(resids)
    
  selection.enter().append('path').transition()
    .attr("d", function(d){
      if(d.y0-d.y1 < -r(200)) {
        return lineFunction([{"x": d.x0, "y": d.y0 + r(200)},{"x": d.x1, "y": d.y1}]); 
      } else if (d.y0 - d.y1 > r(200)){
        return lineFunction([{"x": d.x0, "y": d.y0 - r(200)},{"x": d.x1, "y": d.y1}]);
      } 
    })
    .attr("stroke-width", 1)
    .attr("stroke", "#73B55B")
    .attr('class', 'resline')


  selection.exit().remove()


  selection.each(function(d){
    halfcircles(d);
  })
  return resids;
}
