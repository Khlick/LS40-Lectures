var mouseLineup = function(opts){
	this.data    = opts.data;    //data in ["M","F","M"...] form
  this.element = opts.element; //div we are putting this viz in
  this.marker  = opts.marker;  //svg 
  this.colors  = opts.colors;  // supply with same order as possibleGroups
  this.possibleGroups = opts.possibleGroups; //supply in order of colors
  this.iconWidth = opts.iconWidth || 60;
  this.speed   = 800;          //speed of transitions
  this.exists  = false;        //Flag to prevent draw
  this.hasMask = false;

  if (!this.data.length){ return } // don't draw if theres nothing to draw
  this.draw();
}

mouseLineup.prototype.draw = function() {
	// define width, height and paddings
  this.exists  = true;
  this.padding = 1;
  this.width   = this.element.offsetWidth - (2*this.padding);
  this.height  = (this.width / 2) - (2*this.padding);

  // Don't plot if we don't have any data and draw() was called
  if (!this.data.length){
      this.exists = false;
      return  
  }

  var svg = d4.select(this.element).append('svg')
      .attr('width',  this.width  + (2*this.padding))
      .attr('height', this.height + (2*this.padding));

  // create a defs element for masks
  this.defs = svg.append("defs");
  // check if a mask has been loaded
	if (!this.hasMask) { this.collectMask() }	

  // make a g element to hold whole viz
  this.plot = svg.append('g')
      .attr("class", "mouseCage")
      .attr("transform", "translate(" + this.padding/2 + "," + this.padding/2 + ")");
  
  // create the other stuff
  this.gather();
  this.generateMice();     //convert data to histogram layout
}


//Load mask into def
mouseLineup.prototype.collectMask = function() {
	var obj = this;
//init something
	this.iconProps = {
		'width': 110,
		'height': 110
	};

	svg = d4.select(this.element).select('svg');
	
	d4.html(this.marker, function(data){
		xml= d4.select(data);
    
    mousedefs = xml.select("defs");
    
    obj.defs.node().appendChild(mousedefs.select('style').node());

    icon = document.importNode(xml.select('#MOUSE').node(),true)
    
    mask = obj.defs.append("svg:mask")
        .attr("id", "mouseicon")
    icon.id = "mouse"
    
    mask.node().appendChild(icon)
    
	});
	/*bb = svg.select().select("#mouse").node().getBoundingClientRect();
	this.iconProps.width = bb.width;
  this.iconProps.height = bb.height;*/
	//console.log(this.iconProps)
	this.hasMask = true;
}

mouseLineup.prototype.gather = function() {
	//find unique groups
  var groups = []
  this.data.forEach(function(d){
      if (groups.indexOf(d) == -1){groups.push(d)}
  });

  this.groups = groups.sort(); //Forces groups as Female > Male

  if (this.groups.length < 2) {
  	this.colors = this.colors[this.possibleGroups.indexOf(this.groups[0])];
  }

  this.color_scale = d4.scaleOrdinal() //while we're here create a color scale.
      .domain(this.groups)
      .range(this.colors);
  // append group icon instances
  var obj = this;
  this.groups.forEach(function(group){
  	obj.defs.append("svg:rect")
  		.attr("id", group+"mouse")
      .attr("width", obj.iconProps.width)
      .attr("height", obj.iconProps.height)
      .attr("mask", "url(#mouseicon)")
      .attr("fill", obj.getColor(group))
  });
}

//convenience methods ----------------------------
mouseLineup.prototype.getUseLength = function() {
	try {
		len = this.plot.selectAll('use').nodes().length;
	} catch(e) {
		len = 0;
	}
	return len 
}

mouseLineup.prototype.getColor = function(id) {
	return this.colors[this.groups.indexOf(id)];
}
//------------------------------------------------


mouseLineup.prototype.generateMice = function() {
	var obj = this;
	//make a use object for each mouse in the cage
	mice = this.plot.selectAll('use.mouse')
		.data(this.data, function(d){return d})
	// remove old
	mice.exit()
		.remove()
	//new mice
	len = this.getUseLength();
	nPups = this.data.length;
	scale = obj.iconWidth / obj.iconProps.width;
	mice.enter()
		.append('svg:use')
		.attr('class', 'mouse')
		.attr('xlink:href', function(d){ return '#' + d + 'mouse'; })
		.attr('transform', function(d,i){
			output = 'translate(' + [obj.iconProps.width*(0.5*i),0] + ')scale(' + scale + ')';
			return output
		})
}

mouseLineup.prototype.updatePlot = function(){
    if (!this.data.length){ 
    	this.plot.selectAll('use.mouse').remove();
    	return 
  	} // don't draw if theres nothing to draw
  	if(this.exists){
  		this.gather();
  		this.generateMice();
  		return
  	}
  	this.draw();
}

mouseLineup.prototype.resize = function() {
    //update width and height
    this.width   = this.element.offsetWidth - (2*this.padding);
    this.height  = (this.width / 2) - (2*this.padding);
    //update the svg with this info.
    var svg = d4.select(this.element).select('svg')
        .attr('width',  this.width  + (2*this.padding))
        .attr('height', this.height + (2*this.padding));

    this.updatePlot();
}

mouseLineup.prototype.setData = function(newData) {
    this.data = newData;
    this.updatePlot();
}

mouseLineup.prototype.clearUse = function() {
	if (this.getUseLength()){
		this.plot.selectAll('use').remove();
	}
}