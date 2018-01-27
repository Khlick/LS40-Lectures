var ColorBox = function(opts) {
	// constructor
	this.data = opts.data || [];
	this.dataLabels = opts.dataLabels || [];
	this.element = opts.element || document.getElementsByTagName("BODY")[0];
	this.dims = opts.dims || {width: 200, height: 200}; //plot dimensions excluding margins
	this.margin  = opts.margin || {top: 10, right: 20, bottom: 10, left: 30};
	this.binDim = opts.binDim || 10; //default 10 square, can be length 2 array
	this.colors = opts.colors || ['#88A9C9','#E04B4B'];
	this.transitionSpeed = opts.transitionSpeed || 500;
	
	this.groups = [];
	
	this.exists  = false;
	this.binCheck = false;
	
	this.setBins();
	
	this.bounds = function() {
		return {
			x: this.dims.width + this.margin.left + this.margin.right,
			y: this.dims.height + this.margin.top + this.margin.bottom,
		}
	}
	
	//private method
	function draw() {
		// modify the div
		/*
		d3.select(that.element)
			.attr('style', 'width:'+ (that.bounds().x + 20) +'; height:'+ (that.bounds().y+20)+';')
		*/	
		
		//add the svg
		var svg = d3.select(that.element).append("svg")
            .attr("width", that.bounds().x)
            .attr("height", that.bounds().y)
          .append("g")
            .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")

    //add border style with css
    svg.append("rect")
      .attr("class", "svg-border")
      .attr("x", 0)
      .attr("y", 0)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("width", that.dims.width+4)
      .attr("height", that.dims.height+4)
    
    // Create the tooltip
    that.tip = d3.tip()
      .attr('class', 'd3-tip')
      .style("visibility","visible")
      .offset([parseInt(that.gridSize()/2),that.gridSize()*1.5])
      .html(function(d,i) {
        return `Group:  <span style='color:${that.colorScale(d)}'>${that.dataLabels[i]}` ;
      });
    // call the tooltip
    svg.call(that.tip);

    // render initial scene
    var cnt = 0; //global counter
    that.heatMap = svg.selectAll(".dim2")
          .data(that.data)
      .enter().append("rect")
        .attr("x", function(d,i) { return (i % that.binDim[0]) * that.gridSize() + 3; })
        .attr("y", function(d,i) { return (!(i % that.binDim[0]) ? cnt++ : cnt-1) * that.gridSize() + 3; })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("class", "dim2 bordered")
        .attr("width", that.gridSize()-2)
        .attr("height", that.gridSize()-2)
        .style("fill", function(d){ return that.colorScale(d); })
        .attr("class", "square")
        .on('mouseover', that.tip.show)
        .on('mouseout', that.tip.hide);
		
	}

	this.drawColorBox = function() {
		if (this.data.length != 0 || this.data.length !== undefined){
			if (!this.groups.length) {
				this.getGroups();
			}
			draw();
			this.exists = true;
		}	else {
			this.exists = false;
		}
		
	}
	
	// finalize construction
	var that = this;
	this.getGroups();
	this.drawColorBox();
}


ColorBox.prototype.gridSize = function() {
	// grids must be square, take the minimum of the width/height
	if (!this.binCheck){
		this.setBins(); //force bin update
	}
	var w = Math.floor(this.dims.width/this.binDim[0]);
	var h = Math.floor(this.dims.height/this.binDim[1]);
	return Math.min(w,h);
}

// Property altering methods
ColorBox.prototype.setBins = function(bins) {
	if (bins !== undefined) {
		this.binDim = bins;
	}
	if (this.binDim.length != 2) {
		// could be 1, or undefined, ie not an array
		if (!Array.isArray(this.binDim)){
			this.binDim = [this.binDim, this.binDim];
		} else {
			this.binDim.length = 2;
			this.binDim.fill(this.binDim[0],0,2);
		}
	}
	this.binCheck = true;
	// Alter width and height according to bin dimensions
	var squareSize = this.gridSize();
	if (parseInt(this.dims.height/squareSize) != this.binDim[1]) {
		this.dims.height = squareSize * this.binDim[1];
	}
	if (parseInt(this.dims.width/squareSize) != this.binDim[0]) {
		this.dims.width = squareSize * this.binDim[0];
	}
}

ColorBox.prototype.getGroups = function() {
	if (!this.dataLabels.length || this.dataLabels.length != this.data.length){
		this.dataLabels = Array.from(this.data);
	} 
	this.groups = Array.from(new Set(this.data));
	// Get colors
  if (this.groups.length <= 2){
    var colors = this.colors.slice(0,2);
  } else {
    var colors = d3.interpolateRdYlBu;
  }
  this.colorScale = d3.scaleOrdinal(colors)
    .domain([0, this.groups.length - 1, Math.round(d3.max(this.data))])
}



// Functional methods
ColorBox.prototype.update= function(data,labels) {
	
	if (arguments.length < 2){
		this.dataLabels = Array.from(data);
	} else {
		this.dataLabels = labels;
	}
	this.data = data;
	this.getGroups();
	
	var that = this;
	
	this.heatMap
		  .data(this.data)
		.transition().duration(this.transitionSpeed)
		  .style("fill", function(d) { return that.colorScale( d ); });
	// update tooltips
	this.tip.html(function(d,i) {
	  return `Group:  <span style='color:${that.colorScale(d)}'>${that.dataLabels[i]}` ;
	});
}
