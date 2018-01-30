var Lines = function(opts) {
	// constructor
	this.data = opts.data || []; // obj, or array of objs, [{x:[...],y:[...]},{...}]
	this.element = opts.element || document.getElementsByTagName("BODY")[0];
	this.dims = opts.dims || {width: 200, height: 200}; //plot dimensions excluding margins
	this.margin  = opts.margin || {top: 10, right: 20, bottom: 10, left: 30};
	this.colors = opts.colors || ['#88A9C9']; //must be array
	this.transitionSpeed = opts.transitionSpeed || 1300;
	if (opts.bordered === undefined) {
		this.bordered = false;
	} else {
		this.borded = opts.bordered;
	}
	//
	this.exists  = false;
	
	//privileged methods
	this.bounds = function() {
		return {
			x: this.dims.width + this.margin.left + this.margin.right,
			y: this.dims.height + this.margin.top + this.margin.bottom,
		}
	}
	
	this.drawLines = function() {
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
	
	//private method
	function draw() {
		
	//add the svg
		var svg = d3.select(that.element).append("svg")
            .attr("width", that.bounds().x)
            .attr("height", that.bounds().y)
          .append("g")
            .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")

    if (that.bordered){
    	//add border style
	    svg.append("rect")
	      .attr("class", "svg-border")
	      .attr("x", 0)
	      .attr("y", 0)
	      .attr("rx", 8)
	      .attr("ry", 8)
	      .attr("width", that.dims.width+4)
	      .attr("height", that.dims.height+4)
    }
    
    // render initial scene
    var cnt = 0; //global counter
    that.line = svg.selectAll(".dim2")
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

	// finalize construction
	var that = this;
	this.getGroups();
	this.drawColorBox();
}
