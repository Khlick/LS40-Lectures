var rho_value = 0;
var n = 100;


var $slider = $("#slider");
if ($slider.length > 0) {
  $slider.slider({
    min: -1,
    max: 1,
    value: rho_value,
    orientation: "horizontal",
    range: "min",
    animate: "fast",
    step: 0.01,
    slide: function(event, ui) {
        //$slider.slider("option", "step", parseFloat(0.1));
        rho_value = ui.value;
        change(ui.value);
        update(Math.pow(ui.value, 2));
        $(".tooltip-inner").text(ui.value);},
    start: function(event, ui) {tooltip.tooltip("show"); $(".tooltip-inner").text(ui.value)},
    stop: function() {tooltip.tooltip("hide")}
     });
    }

$slider.find(".ui-slider-handle").append("<div class='slide-tooltip'/>");

var tooltip = $(".slide-tooltip").tooltip( {title: $("#slider").slider("value"), trigger: "manual"});


d3.select('#sample_size').on('change', function() {n = this.value; change(rho_value, n);});
d3.select("#new_sample").on('click', function() {change(rho_value, n);} );


var matrix = function() { };

matrix.cholesky = function(A) {
    var n = A.length;
    
    var L = jStat.zeros(n); // creates a n by n zero matrix.
    
    for (var i = 0; i < n; i++)
    {
        for (var j = 0; j < (i+1); j++) {
            var s = 0;
            for (var k = 0; k < j; k++)
                s += L[i][k] * L[j][k];
            L[i][+ j] = (i == j) ?
                           Math.sqrt(A[i][i] - s) :
                           (1.0 / L[j][j] * (A[i][j] - s));
        }
    }
    
    return jStat.transpose(L);
};

var createCorMatrix = function(rho) {
    return [[1, rho], [rho, 1]];
};

var drawGaussian = function(n, m, sd) {
    var tmp = [];
   for(i = 0; i < n; i++) {
    tmp[i] = d3.random.normal(m, sd)(); 
   } 
   return tmp; 
}

var x = drawGaussian(n, 0, 1),
y = drawGaussian(n, 0, 1);

var setCorrelation = function(x,y, rho_value) {
    rho = createCorMatrix(rho_value)
    var mat = jStat.transpose([x,y]);


    var x_var = jStat.variance(x, true),
        y_var = jStat.variance(y, true),
        x_y_cov = jStat.covariance(x, y);

    var var_cov_mat = [[x_var, x_y_cov], [x_y_cov, y_var]];    

    var x_y_cor = x_y_cov / (Math.sqrt(x_var) * Math.sqrt(y_var));

    var z = jStat.multiply(mat, jStat.multiply( jStat.inv(matrix.cholesky(var_cov_mat)), matrix.cholesky(rho)));

    x = jStat.transpose(jStat(z).col(0));
    y = jStat.transpose(jStat(z).col(1));


    var z_cor = jStat.covariance(x, y) / (jStat.stdev(x, true) * jStat.stdev(y, true));

    return z;
}
var z = setCorrelation(x,y, rho_value);


//$('#output').text('z_cor = ' + z_cor);




// D3

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = parseInt(d3.select('#viz').style('width'), 10) - margin.left - margin.right,
    height = parseInt(d3.select('#viz').style('width'), 10) - margin.top - margin.bottom;

    var x_scale = d3.scale.linear()
        .range([0, width]);

    var y_scale = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
    .scale(x_scale)
    .ticks(5)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y_scale)
    .ticks(5)
    .orient("left");
    
    var svg = d3.select("#viz").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");   


//x_scale.domain(d3.extent(z, function(d) { return d[0]; })).nice();
//  y_scale.domain(d3.extent(z, function(d) { return d[1]; })).nice();

x_scale.domain([-4,4]);
y_scale.domain([-4,4]);

    var test=  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);


var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("drag", dragmove);

function dragmove(d) {
  d3.select(this)
      .attr("cx", d.x = d3.event.x)
      .attr("cy", d.y = d3.event.y);

  var dt = svg.selectAll(".dot").data();    
  var x = dt.map(function(d) {return x_scale.invert(d.x)});
  var y = dt.map(function(d) {return y_scale.invert(d.y)});
      z = dt.map(function(d) {return [x_scale.invert(d.x), y_scale.invert(d.y)]});


      var x_var = jStat.variance(x, true),
        y_var = jStat.variance(y, true),
        x_y_cov = jStat.covariance(x, y);



    var r = x_y_cov / (Math.sqrt(x_var) * Math.sqrt(y_var));


  d3.select("#rho-heading").text(d3.round(r, 2));
  d3.select("#shared-heading").text(d3.round(Math.pow(r, 2) * 100, 1));
  update(Math.pow(r, 2));

var reg_eq = regression('linear', z).equation;
        lm_line
                .attr("x1", x_scale(x_scale.domain()[0]))
                .attr("x2", x_scale(x_scale.domain()[1]))
                .attr("y1", y_scale(x_scale.domain()[0] *  reg_eq[0] + reg_eq[1] ))
                .attr("y2", y_scale(x_scale.domain()[1] *  reg_eq[0] + reg_eq[1]));


$slider.slider("value", r);


}    

function dots(z) {
     var dots = svg.selectAll(".dot")
      .data(z.map(function(d) {return {x:x_scale(d[0]), y:y_scale(d[1])}}))

      dots.enter().append("circle")
           .attr("class", "dot")
             .attr("r", 5)
             .on("mouseover", function() {
                d3.select(this)
                  .transition().duration(400)
                  .attr("r", 10);
             })
             .on("mouseout", function() {
                d3.select(this)
                  .transition().duration(400)
                  .attr("r", 5);
             })
             .call(drag);

      dots.transition()
        .duration(1000)
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

      dots.exit().remove();
}
dots(z);


var reg_eq = regression('linear', z).equation;


          lm_line = svg.append("line")
               .attr("class", "lm-line")
                    .attr("x1", x_scale(x_scale.domain()[0]))
                    .attr("x2", x_scale(x_scale.domain()[1]))
                    .attr("y1", y_scale(reg_eq[1]))
                    .attr("y2", y_scale(reg_eq[1]));


     




// VIZ 2


// var svg2 = d3.select("#viz2").append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");   

// var x_scale2 = d3.scale.ordinal().domain(['pre', 'post']).rangePoints([0, width], 0.3);

//     var xAxis2 = d3.svg.axis()
//     .scale(x_scale2)
//     .orient("bottom");

//       svg2.append("g")
//       .attr("class", "x axis")
//       .attr("transform", "translate(0," + height + ")")
//       .call(xAxis2)


//   svg2.append("g")
//       .attr("class", "y axis")
//       .call(yAxis)



//    var lines = svg2.append("g").selectAll(".line")
//       .data(z)
//     .enter().append("line")
//       .attr("class", "line")
//       .attr("x1", x_scale2('pre'))
//       .attr("x2", x_scale2('post'))
//       .attr("y1", function(d) { return y_scale(d[0]);} )
//       .attr("y2", function(d) { return y_scale(d[1]);} )




 var change = function(rho, n) {

        if(n) {
          x = drawGaussian(n, 0, 1),
          y = drawGaussian(n, 0, 1);

        z = setCorrelation(x,y, rho);
        
       dots(z);
       reg_eq = regression('linear', z).equation;
        lm_line
                .attr("x1", x_scale(x_scale.domain()[0]))
                .attr("x2", x_scale(x_scale.domain()[1]))
                .attr("y1", y_scale(x_scale.domain()[0] *  reg_eq[0] + reg_eq[1] ))
                .attr("y2", y_scale(x_scale.domain()[1] *  reg_eq[0] + reg_eq[1]));
    
        } else {
        z = setCorrelation(x,y, rho);

        dots(z);
reg_eq = regression('linear', z).equation;
        lm_line
                .attr("x1", x_scale(x_scale.domain()[0]))
                .attr("x2", x_scale(x_scale.domain()[1]))
                .attr("y1", y_scale(x_scale.domain()[0] *  reg_eq[0] + reg_eq[1] ))
                .attr("y2", y_scale(x_scale.domain()[1] *  reg_eq[0] + reg_eq[1]));

    // d3.selectAll(".line")
    //   .data(z)
    //   .attr("y1", function(d) { return y_scale(d[0]);} )
    //   .attr("y2", function(d) { return y_scale(d[1]);} )

        }

    d3.select("#rho-heading").text(rho);
    d3.select("#shared-heading").text(d3.round(Math.pow(rho, 2) * 100, 1));
    $slider.slider("value", rho);
      }




var venn = {};

    venn.margin = {top: 20, right: 10, bottom: 30, left: 10};
    venn.width = parseInt(d3.select('#viz').style('width'), 10) - venn.margin.left - venn.margin.right;
    venn.height = venn.width/2;

  venn.svg = d3.select("#venn2").append("svg")
    .attr("width", venn.width + venn.margin.left + venn.margin.right)
    .attr("height", venn.height + venn.margin.top + venn.margin.bottom)
  .append("g")
    .attr("transform", "translate(" + venn.margin.left + "," + venn.margin.top + ")");  




venn.r = (parseInt(d3.select('#viz').style('width'), 10) - venn.margin.left - venn.margin.right)/4;  
venn.x1 = venn.r;
venn.x2 = venn.r*3,
venn.y = venn.r;

venn.intersect_x = venn.x1 + (venn.x2-venn.x1)/2



venn.defs = venn.svg.append("svg:defs");

venn.clip1 = venn.defs.append("svg:clipPath")
    .attr("id", "clip1")
  .append("rect")
    .attr("width", venn.r*2)
    .attr("height", venn.r*2)
    .attr("x", venn.intersect_x)
    .attr("y", 0);

venn.clip2 = venn.defs.append("svg:clipPath")
    .attr("id", "clip2")
  .append("rect")
    .attr("width", venn.intersect_x)
    .attr("height", venn.r*2)
    .attr("x", 0)
    .attr("y", 0);

venn.circle = venn.svg.append("circle");

venn.circle.attr("r", venn.r)
  .attr("class", "circle1")
  .attr("cx", venn.x1)
  .attr("cy", venn.y);

venn.circle2 = venn.svg.append("circle");

venn.circle2.attr("r", venn.r)
  .attr("class", "circle2")
  .attr("cx", venn.x2)
  .attr("cy", venn.y);  


venn.intersect1 = venn.svg.append("circle");

venn.intersect1
  .attr("clip-path", "url(#clip1)")
  .attr("r", venn.r)
  .attr("class", "intersect")
  .attr("cx", venn.x1)
  .attr("cy", venn.y);

venn.intersect2 = venn.svg.append("circle");

venn.intersect2
  .attr("clip-path", "url(#clip2)")
  .attr("r", venn.r)
  .attr("class", "intersect")
  .attr("cx", venn.x2)
  .attr("cy", venn.y);  


function update(k) {
  k = k/2;
  var t0, t1 = k * 2 * Math.PI;

  // Solve for theta numerically.
  // from http://bl.ocks.org/mbostock/3422480
  if (k > 0 && k < 1) {
    t1 = Math.pow(12 * k * Math.PI, 1 / 3);
    for (var i = 0; i < 10; ++i) {
      t0 = t1;
      t1 = (Math.sin(t0) - t0 * Math.cos(t0) + 2 * k * Math.PI) / (1 - Math.cos(t0));
    }
    k = (1 - Math.cos(t1 / 2)) / 2;
  }

  var w = 2 * venn.r * k,
      y = venn.r - w,
      a = (Math.PI - t1) / 2;
      venn.x2 = w+2*venn.r;
  var x_intersect = (venn.x1+venn.r)-w;


var ease = "elastic";

venn.circle2.transition().duration(1000).ease(ease)
  .attr("cx", venn.x1+ 2*(venn.r - w))  

venn.intersect2.transition().duration(1000).ease(ease)
  .attr("cx", venn.x1+ 2*(venn.r - w))  
 
 venn.clip1.transition().duration(1000).ease(ease)
  .attr("x", x_intersect-1); 


 venn.clip2.transition().duration(1000).ease(ease)
  .attr("width", x_intersect); 
}

  

