var Hist = function(opts) {
    // load in arguments from config object
    this.data    = opts.data;
    this.element = opts.element;
    this.margin  = opts.margin || {top: 10, right: 30, bottom: 30, left: 30};
    this.exists  = false;
    this.bounds = opts.bounds || [];
    this.hasHist = false;
    //validate bins arg
    this.bins = opts.bins || [];
    // create the Hist
    if (this.data.length){
        if (!this.validateBins()) { return; }
        this.draw();    
    }
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
    if (!this.bounds.length){
        this.bounds = d4.extent(this.data);

        var max = d4.max(this.bounds);
        var min = d4.min(this.bounds);

        if (max === min){
            max *= 0.99;
            min *= 1.01;
            this.bounds = [min,max];
        }
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
        .thresholds(this.scaleX.ticks(this.bins))
        (this.data);
    
    //debug
    this.theBins = bins;
    binWidth = this.scaleX(bins.length)/bins.length
    //console.log("binwidth",binWidth)
    var scaleY = d4.scaleLinear()
        .domain([0, d4.max(bins, function(d) { return d.length })*1.1])
        .range([this.height, 0])
    
    // draw bars
    var bar = this.plot.selectAll('.bar')
        .data(bins);
    
    // If we have the histogram already, let's draw new bars and then update any bars that exist
    // Draw new bars and update existing.
    if (this.hasHist){
        // Update old bars
        bar.transition().duration(500)
            .attr('transform', 
                function(d) {
                    return 'translate(' + that.scaleX(d.x0) + ',' + scaleY(d.length) + ')';
                })
            .each(function(dat){
                // dat contains:
                //   [bin #, x0: bin start, x1: bin end]
                // dat.length will be the count
                var count = dat.length;
                // draw new
                bar.enter().append('g')
                    .attr('class','hist-bar bar')
                    .attr('transform', 
                        function(d) {
                            return 'translate(' + that.scaleX(d.x0) + ',' + scaleY(count) + ')';
                        })
                    .each(function(dat){
                        
                        d4.select(this).selectAll("rect")
                            .data(dat)
                            .enter().append("rect")
                                .attr("x", 1)
                                .attr("width", binWidth - 1)
                                .attr("height", function(d) { 
                                    return that.height - scaleY(count); });

                        d4.select(this).selectAll("text")
                            .data(dat)
                            .append("text")
                                .attr("dy", "0.1em")
                                .attr("y", 1)
                                .attr("x", (binWidth-1) / 2)
                                .attr("text-anchor", "middle")
                                .text(function(d) { 
                                    return formatC(count); });
                    });
                //update existing
                
                d4.select(this).selectAll("rect")
                    .transition().duration(500)
                    .attr("x", 1)
                    .attr("width", binWidth - 1)
                    .attr("height", function(d) { 
                        return that.height - scaleY(count); });

                d4.select(this).selectAll("text")
                    .transition().duration(500)
                    .attr("dy", "-0.3em")
                    .attr("y", 1)
                    .attr("x", (binWidth - 1) / 2)
                    .attr("text-anchor", "middle")
                    .text(function(d) { 
                        return formatC(count); });

            });
            //update axis
            this.plot.select(".axis--x").transition().duration(500)
                .call(d4.axisBottom(this.scaleX))
                    .selectAll("text")
                    .attr("transform", "translate(0," + 1 + ")")
        }
    // If we have a graph but do not have histogram, let's draw them
    // Draw for the first time
    if (!this.hasHist){
        // draw new bars
        bar.enter().append('g')
            .attr('class','hist-bar bar')
            .attr('transform', 
                function(d) {
                    return 'translate(' + that.scaleX(d.x0) + ',' + scaleY(bins[d.x0].length) + ')';
                })
            .each(function(dat){
                //console.log("each Dat",dat.length)
                d4.select(this).append("rect")
                    .attr("x", 1)
                    .attr("width", binWidth - 1)
                    .attr("height", function(d) { 
                        return that.height - scaleY(dat.length); });

                d4.select(this).append("text")
                    .attr("dy", "-0.3em")
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
                .call(d4.axisBottom(this.scaleX))
                    .selectAll('text')
                    .attr('transform', 'translate(0,' + 1 + ')');
        this.hasHist = true;
    }
    
}



// Convenience methods
Hist.prototype.formatC = function(num) {
    return d4.format(',.0f')(num);
}

Hist.prototype.validateBins = function(){
    if (!this.bins || !this.bins.length){
        return true;
    }
    return false;
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