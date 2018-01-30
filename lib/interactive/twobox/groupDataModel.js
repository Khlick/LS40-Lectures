// no d3 dependence
var GroupData = function(data){
    this.data = data; // [{val: 4, group: 'a'},...]
    this.groups = [];
    
    // internal scoping
    var that = this;
    
    // private functions
    function isDataCompatible() {
        if (!(that.data instanceof Array)) { return false; }
        var elementHasKeys = [];
        that.data.forEach(function(obj) {
            var testResults = [];
            for (var key in obj) {
                testResults.push(obj.hasOwnProperty(key));
            }
            elementHasKeys.push(testResults.every(function(a){ return !!a; }));
        });
        if (elementHasKeys.every(function(a){ return !!a; })) { return true; }
        return false;
    }
    
    // privileged functions
    this.prepareGroups = function() {
        if (!isDataCompatible()) {
            return;
        }
        var groups = [];
        that.data.forEach(function(d){
            //if groups doesn't contain the current group val, push it
            if (groups.indexOf(d.group) == -1){ groups.push(d.group) };
        });
        // using internal variable will ensure overwrite and not append on data change
        that.groups = groups.sort();
        that.groupInds = Array.from(new Array(that.groups.length),(val,index)=>index);
    }
    
    //finalize construction
    if (!isDataCompatible()) { return; }
    this.prepareGroups();
}

// public methods
GroupData.prototype.getValues = function(stop,start=0){
    if (arguments.length < 2) {
        stop = this.data.length;
    }
    var vals = [];
    this.data.forEach(function(d){
        vals.push(d.val);
    });
    
    return vals.slice(start,stop);
}

GroupData.prototype.getGroups = function(stop,start=0) {
    if (arguments.length < 2) {
        stop = this.data.length;
    }
    var groups = [],
        indeces = [],
        that = this;
    this.data.forEach(function(d){
        groups.push(d.group);
        indeces.push(that.groupInds[that.groups.indexOf(d.group)]);
    });
    
    return {names:groups.slice(start,stop), inds:indeces.slice(start,stop)};
}
