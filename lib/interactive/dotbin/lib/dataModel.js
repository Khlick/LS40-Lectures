// no d3 dependence
var Data = function(opts){
    this.isReady = false;
    if (typeof opts==='number'){
        this.populationSize = opts;
        this.type = 'normal';
    }
    if (typeof opts==='object' && opts!==null && !(opts instanceof Array)){
        // opts is a dictionary
        this.populationSize = opts.populationSize || 0; //must be scalar
        this.type = opts.type || 'normal';
    }
    this.parameters = {mu: 4.5, sigma: 1, lambda: 1/2.5, min: 0, max: 10};
    if (!this.populationSize){ return; }
    this.initialize();
}

// Generate distribution
Data.prototype.initialize = function(N) {
    if (arguments.length && this.populationSize != N) {
        // override N then generate new population
        this.populationSize = N;
        this.initialize();
        return
    }
    // compute the population
    switch (this.type) {
        case 'normal':
            this.population = d3.range(this.populationSize).map(d3.randomNormal(this.parameters.mu,this.parameters.sigma));
            break;
        case 'uniform':
            this.population = d3.range(this.populationSize).map(d3.randomUniform(this.parameters.min,this.parameters.max));
            break;
        case 'log-normal':
            this.population = d3.range(this.populationSize).map(d3.randomLogNormal(this.parameters.mu,this.parameters.sigma));
            break;
        case 'exponential':
            this.population = d3.range(this.populationSize).map(d3.randomExponential(this.parameters.lambda));
            break;
        default:
            // normal
            this.type = 'normal';
            this.initialize();
    }
    this.isReady = true;
}


// redefine parameters
Data.prototype.theParameters = function(p){
    if(!arguments.length){
        return this.parameters;
    }
    for(var k in p){
        this.parameters[k] = p[k];
    }
}


// sample from population
Data.prototype.sample = function(N) {
    if (!this.isReady){ return [];}
    return this.population.slice(-N)
}

Data.prototype.changeDistribution = function(distString) {
    if (this.type === distString) {
        // Do nothing
        return;
    }
    this.type = distString.toLowerCase(); // just in case it isnt
    this.initialize();
}