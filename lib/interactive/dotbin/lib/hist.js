var Hist = function(opts) {
    // load in arguments from config object
    this.data    = opts.data;
    this.element = opts.element;
    this.margin  = opts.margin || {top: 10, right: 30, bottom: 30, left: 30};
    this.exists  = false;
    this.bounds = opts.bounds || [];
    this.hasHist = false;
    
    //validate bins arg
    this.bins = opts.bins || 0;
    // Force a call to draw
}

Hist.prototype.draw = function() {
    //compute height/width
    this.width = +this.element.offsetWidth - this.margin.left - this.margin.right;
    this.height = this.width/2 - this.margin.top - this.margin.bottom;

    
    var svg = d4.select(this.element).append('svg')
        .attr('width',  this.width  + (this.margin.left + this.margin.right))
        .attr('height', this.height + (this.margin.bottom + this.margin.top));

    this.plot = svg.append('g')
        .attr('class', 'hist-box')
        .attr('transform', 'translate(' + this.margin.left + '.' + this.margin.top + ')');

    this.constructHist();
    this.exists = true;
}

Hist.prototype.constructHist = function(){
    var that = this;
    var formatC = d4.format(',.0f');
    // validate bounds
    
    this.bounds = d4.extent(this.data);

    var max = d4.max(this.bounds);
    var min = d4.min(this.bounds);

    if (max === min){
        max *= 0.99;
        min *= 1.01;
        this.bounds = [min,max];
    }
    // validate bins
    if (!this.bins){
        this.bins = d4.thresholdFreedmanDiaconis(this.data, this.bounds[0], this.bounds[1]);
    }
    // xscale
    this.scaleX = d4.scaleLinear()
        .rangeRound([0,this.width])
        .domain(this.bounds);
    // The histogram will generate a value for each bin
    // so we can use bins.length in the case of unknown bins
    // Each element in bins with contain an entry for each count
    // e.g. if bin 1 (element 0) has length 2, then it will have the data contained within
    var bins = d4.histogram()
        .domain(this.scaleX.domain())
        .thresholds(d4.range(this.bounds[0], this.bounds[1], Math.abs(this.bounds.reduce((o,i) => o-i)/this.bins)))
        (this.data);
    
    // ref available to other methods
    this.theBins = bins;

    // Calculate bin width
    binWidth = (this.scaleX(bins.slice(-1)[0].x1)-this.scaleX(bins[0].x0)-1)/bins.length;
    tickLocations = d4.range(bins.length+1).map(v => bins[0].x0+v*(bins.slice(-1)[0].x1-bins[0].x0)/bins.length);

    // y scale
    var scaleY = d4.scaleLinear()
        .domain([0, d4.max(bins, function(d) { return d.length })*1.1])
        .range([this.height, 0])
    this.scaleY = scaleY;
    // draw bars
    var bar = this.plot.selectAll('.bar')
        .data(bins);


    // If we have the histogram already, let's draw new bars and then update any bars that exist
    // Draw new bars and update existing.
    if (this.hasHist){
        // Update the bars that exist already
        bar.transition().duration(500)
            .attr('transform', 
                function(d) {
                    return 'translate(' + that.scaleX(d.x0) + ',' + scaleY(d.length) + ')';
                })
            .each(function(dat){
                // dat contains:
                //   [data, x0: bin start, x1: bin end]
                // dat.length will be the count
                var count = dat.length;
                //update existing
                d4.select(this).selectAll("rect")
                    .transition().duration(500)
                    .attr("x", 1)
                    .attr("width", binWidth - 1)
                    .attr("height", function(d) { 
                        return that.height - scaleY(count); });

                d4.select(this).selectAll("text")
                    .transition().duration(500)
                    .attr("text-anchor", "middle")
                    .attr("x", (binWidth-1)/2)
                    .text(function(d) { 
                        return formatC(count); 
                    });
            });
        // draw new
        bar.enter().append('g')
            .attr('class','hist-bar bar')
            .attr('transform', 
                function(d) {
                    return 'translate(' + that.scaleX(d.x0) + ',' + scaleY(d.length) + ')';
                })
            .each(function(dat){
                // dat contains:
                //   [data, x0: bin start, x1: bin end]
                // dat.length will be the count
                var count = dat.length;
                d4.select(this).selectAll("rect")
                        .data(dat)
                    .enter().append("rect")
                        .attr("x", 1)
                        .attr("width", binWidth - 1)
                        .attr("height", function(d) { 
                            return that.height - scaleY(count); })
               

                d4.select(this).selectAll("text")
                        .data(dat)
                    .enter().append("text")
                        .attr("dy", "-0.35em")
                        .attr("y", 1)
                        .attr("x", (binWidth-1) / 2)
                        .attr("text-anchor", "middle")
                        .text(function(d) { 
                            return formatC(count); })
               
            });

        //update axis
        this.plot.select(".axis--x").transition().duration(500)
            .call(d4.axisBottom(this.scaleX).tickValues(tickLocations))
                .selectAll("text")
                .attr("transform", "translate(0," + 1.5 + ")")
        }
    // If we have a graph but do not have histogram, let's draw them
    // Draw for the first time
    if (!this.hasHist){
        // draw new bars
        bar.enter().append('g')
            .attr('class','hist-bar bar')
            .attr('transform', 
                function(d,i) {
                    return 'translate(' + that.scaleX(d.x0) + ',' + scaleY(d.length) + ')';
                })
            .each(function(dat){
                //console.log("each Dat",dat.length)
                d4.select(this).append("rect")
                    .attr("x", 1)
                    .attr("width", binWidth - 1)
                    .attr("height", function(d) { 
                        return that.height - scaleY(dat.length); });

                d4.select(this).append("text")
                    .attr("dy", "-0.35em")
                    .attr("y", 1)
                    .attr("x", (binWidth-1) / 2)
                    .attr("text-anchor", "middle")
                    .text(function(d) { 
                        return formatC(d.length); });
            });
            //draw axes
            this.plot.append("g")
                .attr("class", "axis axis--x hist-axis")
                .attr("transform", "translate(0," + this.height + ")")
                .call(d4.axisBottom(this.scaleX).tickValues(tickLocations))
                    .selectAll('text')
                    .attr('transform', 'translate(0,' + 1.5 + ')');
        this.hasHist = true;
    }
    // remove stuff
    bar.exit().remove();
}



// Convenience methods
Hist.prototype.formatC = function(num) {
    return d4.format(',.0f')(num);
}

Hist.prototype.validateBins = function(){
    if (!this.bins){
        return false;
    }
    return true;
}

//Public
Hist.prototype.setData = function(newData){
    if (!newData.length){
        return
    }
    this.data = newData;

    if (this.data.length){
        if (!this.validateBins()) { return; }
        if (!this.exists) {
            this.hasHist = false;
            this.draw(); 
            return;
        }
        this.constructHist();    
    }
}


Hist.prototype.reset = function(){
    if ( !this.exists ) { return }
    d4.select(this.element).select('svg').remove();
    this.hasHist = false;
    this.exists = false;
}

Hist.prototype.setBins= function(nBins){
    if (this.bins == nBins) {
        return;
    }
    // update bins
    this.bins = nBins;
    // if svg needs drawing
    if (!this.exists) {
        this.hasHist = false;
        this.draw();
        return;
    }
    // otherwise update current hist
    this.constructHist();
}