var Knn = function (options) {
	options = options || {};
	
	var self = this;
	var calc = require('./calc.js');
	self.weightFunctionSigma = options['weightFunctionSigma'] || 10;
	self.weights = options['weights'] || null;
	self.data = options['data'] || [];
	self.results = options['results'] || [];
	self.k = options['k'] || 3;
	self.maxDistance = options['maxDistance'] || 5;
	self.folds = options['folds'] || 10;
	self.report = {};
	
	self.setData = function (data, append) {
		if (self.data.length > 0 && append) self.data.concat(data);
		else self.data = data;
	}
	
	self.setResults = function (results, append) {
		if (self.results.length > 0 && append) self.results.concat(results);
		else self.results = results;
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
	
	self.train = function () {
		var dataBkp = cloneArray(self.data);
		var resultsBkp = cloneArray(self.results);
		var dataLength = self.data.length;
		var foldLength = parseInt(self.data.length / self.folds);
		var validation = [];
		for (var i = 0; i < self.folds; i++) {
			var data = cloneArray(dataBkp);
			var results = cloneArray(resultsBkp);
			var dataFold = data.splice(i * foldLength, foldLength);
			var resultsFold = results.splice(i * foldLength, foldLength);
			self.data = data;
			self.results = results;
			for (var j in dataFold) {
				validation.push({real : resultsFold[j], predicted : self.run(dataFold[j])});
			}
		}
		var sum = parseFloat(0);
		var sumsq = parseFloat(0);
		for (var i in validation) {
			var error = Math.abs(validation[i].real - validation[i].predicted);
			var sq = parseFloat(error * error);
			sum += error;
			sumsq += sq;
		}
		self.report = { 
			mse : sumsq/dataLength,
			std : Math.sqrt(sumsq/dataLength),
			mean : sum/dataLength,
			size : dataLength
		};
		self.data = cloneArray(dataBkp);
		self.results = cloneArray(resultsBkp);
		return self.report;
	}
	
	self.run = function (x) {
		var distances = [];
		var i;
		var avg = 0.0;
		var totalWeight = 0;
		var weight;
		var k = self.k == 0 ? self.data.length : self.k
		
		for (i = 0; i < self.data.length; i++) {
			distances.push({
				index : i,
				distance : self.getDistance(x, self.data[i])
			});
		}
		
		distances.sort(function(a, b) {return a.distance - b.distance;});
				
		for (i = 0; i < Math.min(k, distances.length); i++) {
			if (self.maxDistance && distances[i].distance > self.maxDistance && i > 0) {
				break;
			}
			weight = self.getWeight(distances[i].distance);
			avg += weight * self.results[distances[i].index];
			totalWeight += weight;
		}
		
		if (totalWeight != 0) avg = avg/totalWeight;
		
		return avg;
	}
	
	self.getWeight = function (x) {
		return 	calc.gaussian(x,self.weightFunctionSigma);
	}
	
	self.getDistance = function (a,b) {
		if (self.weights) {
			return calc.weightedEuclidean(a,b,self.weights);
		}
		else {
			return calc.euclidean(a,b);
		}
	}
	
	return self;
}

module.exports = Knn;
