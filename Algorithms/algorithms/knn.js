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
    var start = new Date().getTime();
	
	prediction.results = [];
	
	for (var i in predictorSet.data) {
		prediction.results.push(this.run(predictorSet.data[i]));	
	}
    
    var end = new Date().getTime();
    
    prediction.time = {
        total : end - start,
        avg : (end - start) / prediction.results.length
    };
    
    prediction.size = predictorSet.data.length;
		    
    if (cb) {
        cb(prediction);
    } else {
        return prediction;
    }
}

Knn.prototype.test = function (testSet, cb) {
    var test = this.predict(testSet);
    
    var sum = parseFloat(0);
    var sumsq = parseFloat(0);
    var dataLength = testSet.data.length;
    
    for (var i in test.results) {
        var error = Math.abs(test.results[i] - testSet.results[i]);
        var sq = parseFloat(error * error);
        sum += error;
        sumsq += sq;
    }
    
    test.errors = { 
        mse : sumsq/dataLength,
        std : Math.sqrt(sumsq/dataLength),
        mean : sum/dataLength
    };
        
    if (cb) {
        cb(test);
    } else {
        return test;
    }
}

Knn.prototype.validate = function (trainingSet, cb) {    
    if (trainingSet) {
        this.setData(trainingSet.data, true);
        this.setResults(trainingSet.results, true);
    }
    
    var start = new Date().getTime();
        
    var dataBkp = cloneArray(this.data);
    var resultsBkp = cloneArray(this.results);
    var dataLength = this.data.length;
    var foldLength = parseInt(this.data.length / this.folds);
    var validation = [];
    var validationResults = [];
    for (var i = 0; i < this.folds; i++) {
        var data = cloneArray(dataBkp);
        var results = cloneArray(resultsBkp);
        var dataFold = data.splice(i * foldLength, foldLength);
        var resultsFold = results.splice(i * foldLength, foldLength);
        this.data = data;
        this.results = results;
        for (var j in dataFold) {
            var prediction = this.run(dataFold[j]);
            validation.push({real : resultsFold[j], predicted : prediction});
            validationResults.push(prediction);
        }
    }
    
    var end = new Date().getTime();
    
    var sum = parseFloat(0);
    var sumsq = parseFloat(0);
    for (var i in validation) {
        var error = Math.abs(validation[i].real - validation[i].predicted);
        var sq = parseFloat(error * error);
        sum += error;
        sumsq += sq;
    }
    var report = { 
        //results : validationResults,
        errors : {
            mse : sumsq/dataLength,
            std : Math.sqrt(sumsq/dataLength),
            mean : sum/dataLength
        },
        time : {
            total : end - start,
            avg : (end - start)/dataLength,
        },
        size : dataLength
    };
    this.data = cloneArray(dataBkp);
    this.results = cloneArray(resultsBkp);
        
    if (cb) {
        cb(report);
    } else {
        return report;
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

var cloneArray = function (arr) {
    var clone = [];
    for (var i in arr) {
        if (Array.isArray(arr[i])) {
            var inside = [];
            for (var j in arr[i]) {
                inside.push(arr[i][j]);
            }
            clone.push(inside);
        } else {
            clone.push(arr[i]);
        }
    }
    return clone;
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
