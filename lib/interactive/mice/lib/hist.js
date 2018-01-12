var Hist = function(opts) {
    // load in arguments from config object
    this.data    = opts.data;
    this.element = opts.element;
    this.margin  = opts.margin || {top: 10, right: 30, bottom: 30, left: 30};
    this.exists  = false;
    this.bounds = opts.bounds || [];
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
        var min = d3.min(this.bounds);

        if (max === min){
            max += 1;
            min -= 1;
            this.bounds = [min,max];
        }
    }
    
    // xscale
    this.scaleX = this.scaleX || d4.scaleLinear()
        .rangeRound([0,this.width])
        .domain(this.bounds);
    
    var bins = d4.histogram()
        .domain(this.scaleX.domain())
        .thresholds(this.scaleX.ticks(this.bins))
        (this.data);

    var scaleY = d4.scaleLinear()
        .domain([0, d4.max(bins, function(d) { return d.length })])
        .range([this.height, 0])
    
    // draw bars
    var bar = this.plot.selectAll('.bar')
        .data(bins)
        .enter().append('g')
            .attr('class','hist-bar bar')
            .attr('transform', 
                function(d) {
                    return 'translate(' + that.scaleX(d.x0) + ',' + scaleY(d.length) + ')';
                });
    bar.append("rect")
        .attr("x", 1)
        .attr("width", this.scaleX(bins[0].x1) - this.scaleX(bins[0].x0) - 1)
        .attr("height", function(d) { return that.height - scaleY(d.length); });

    bar.append("text")
        .attr("dy", ".75em")
        .attr("y", 6)
        .attr("x", (this.scaleX(bins[0].x1) - this.scaleX(bins[0].x0)) / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { 
            console.log(formatC(d.length));
            return formatC(d.length); });

    this.plot.append("g")
        .attr("class", "axis axis--x hist-axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(d4.axisBottom(this.scaleX));
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