var calc = require('./libs/calc.js');

var Knn = function (options) {
	options = options || {};
    
	this.weightFunctionSigma = options['weightFunctionSigma'] || 10;
	this.weights = options['weights'] || null;
	this.k = options['k'] || 3;
	this.maxDistance = options['maxDistance'] || 5;
	this.folds = options['folds'] || 10;
    
	this.data = options['data'] || [];
	this.results = options['results'] || [];
    
    if (this.weights) {
        for (var i in this.weights) {
            if (this.weights[i] != 0) { this.weights[i] = Math.pow(10, this.weights[i] - 1); }
        }
    }
}

Knn.prototype.train = function (trainingSet, cb) {
    if (trainingSet) {
        this.setData(trainingSet.data, true);
        this.setResults(trainingSet.results, true);
    }
    
    if (cb) {
        cb();
    } else {
        return true;
    }
}

Knn.prototype.predict = function (predictorSet, cb) {
    var prediction = {};
	var results = [];
	
	for (var i in predictorSet.data) {
		results.push(this.run(predictorSet.data[i]));	
	}
		    
    if (cb) {
        cb(results);
    } else {
        return results;
    }
}

Knn.prototype.setData = function (data, append) {
    if (this.data.length > 0 && append) this.data.concat(data);
    else this.data = data;
}

Knn.prototype.setResults = function (results, append) {
    if (this.results.length > 0 && append) this.results.concat(results);
    else this.results = results;
}


Knn.prototype.run = function (x) {
    var distances = [];
    var i;
    var avg = 0.0;
    var totalWeight = 0;
    var weight;
    var k = this.k == 0 ? this.data.length : this.k
    
    for (i = 0; i < this.data.length; i++) {
        distances.push({
            index : i,
            distance : this.getDistance(x, this.data[i])
        });
    }
    
    distances.sort(function(a, b) {return a.distance - b.distance;});
            
    for (i = 0; i < Math.min(k, distances.length); i++) {
        if (this.maxDistance && distances[i].distance > this.maxDistance && i > 0) {
            break;
        }
        weight = this.getWeight(distances[i].distance);
        avg += weight * this.results[distances[i].index];
        totalWeight += weight;
    }
    
    if (totalWeight != 0) avg = avg/totalWeight;
    
    return avg;
}

Knn.prototype.getWeight = function (x) {
    return 	calc.gaussian(x,this.weightFunctionSigma);
}

Knn.prototype.getDistance = function (a,b) {
    if (this.weights) {
        return calc.weightedEuclidean(a,b,this.weights);
    }
    else {
        return calc.euclidean(a,b);
    }
}

module.exports = Knn;
