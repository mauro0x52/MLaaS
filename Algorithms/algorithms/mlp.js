var synaptic = require('synaptic'); 
var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

var Mlp = function (params) {
    
    this.options = {
        rate: params.rate || 0.1,
        iterations: params.iterations || 10000,
        error: params.error || .0001,
        shuffle: params.hasOwnProperty('shuffle') ? params.shuffle : true,
        log: params.hasOwnProperty('log') ? params.log : 0,
        folds: params.folds || 10,
        layers : params.layers
    }
    
    this.perceptron = null;
    this.trainer = null;
    this.report = null;

    this.normalization = { input : [], output : { min : 0, max : 0 } };
    
    if (this.options.layers) this.build();
}

Mlp.prototype.normalize = function (originalTrainingSet) {
	var trainingSet = [];
	var data = originalTrainingSet.data;
	var results = originalTrainingSet.results;
	
	for (var i in data) {
		trainingSet.push({input : data[i], output : [results[i]]});
		if (this.normalization.output.min > results[i]) this.normalization.output.min = results[i];
		if (this.normalization.output.max < results[i]) this.normalization.output.max = results[i];
		for (var j in trainingSet[i].input) {
			if (i == 0) {
				this.normalization.input.push({max : 0, min : 0});
			}
			if (this.normalization.input[j].min > trainingSet[i].input[j]) this.normalization.input[j].min = trainingSet[i].input[j];
			if (this.normalization.input[j].max < trainingSet[i].input[j]) this.normalization.input[j].max = trainingSet[i].input[j];
		}
	}
	
	for (var i in trainingSet) {
		for (var j in trainingSet[i].input) {
			if (this.normalization.input[j].max - this.normalization.input[j].min == 0) trainingSet[i].input[j] = 0;
			else trainingSet[i].input[j] = (trainingSet[i].input[j] - this.normalization.input[j].min) / (this.normalization.input[j].max - this.normalization.input[j].min);
		}
		if (this.normalization.output.max - this.normalization.output.min == 0) trainingSet[i].output = 0;
		else trainingSet[i].output = [(trainingSet[i].output[0] - this.normalization.output.min) / (this.normalization.output.max - this.normalization.output.min)];
	}
    
    return trainingSet;
}

Mlp.prototype.build = function (inputLength) {
	if (!this.perceptron) {
		if (!this.options.hasOwnProperty('layers') && inputLength) {
			this.options.layers = [inputLength, 2*inputLength, 1];
		}
		this.perceptron = new Architect.Perceptron(this.options.layers[0], this.options.layers[1], 1);
		this.trainer = new Trainer(this.perceptron);
	}
}

Mlp.prototype.train = function (trainingSet, cb) {		
    this.build(trainingSet.data[0].length);
	this.trainer.train(this.normalize(trainingSet), this.options);
    
    if (cb) {
        cb();
    } else {
        return true;
    }	
}

	
Mlp.prototype.validate = function (originalTrainingSet, cb) {
    this.build(originalTrainingSet.data[0].length);
    trainingSet = this.normalize(originalTrainingSet);
    
	var dataLength = trainingSet.length;
	var foldLength = parseInt(trainingSet.length / this.options.folds);
	var validation = [];
	var start = new Date().getTime(); 
	
	for (var i = 0; i < this.options.folds; i++) {
		var trainingSetClone = trainingSet.slice(0);	
		var dataFold = trainingSetClone.splice(i * foldLength, foldLength);
		var trainer = new Trainer(this.perceptron, this.options);
		trainer.train(trainingSetClone, this.options);
		for (var j in dataFold) {
			validation.push({real : dataFold[j].output[0], predicted : this.perceptron.activate(dataFold[j].input)[0]});
		}
	}
		
	var sum = parseFloat(0);
	var sumsq = parseFloat(0);
	for (var i in validation) {
		var error = Math.abs(validation[i].real - validation[i].predicted);
		error = error * (this.normalization.output.max - this.normalization.output.min) + this.normalization.output.min;
		var sq = parseFloat(error * error);
		sum += error;
		sumsq += sq;
	}
	var report = { 
        errors : {
            mse : sumsq/dataLength,
            std : Math.sqrt(sumsq/dataLength),
            mean : sum/dataLength
        },
		size : dataLength,
		time : {
            total : new Date().getTime() - start,
            avg : (new Date().getTime()) - start / dataLength
        }
	};
        
    if (cb) {
        cb(report);
    } else {
        return report;
    }	
}

Mlp.prototype.predict = function (predictorSet, cb) {	
	var start = new Date().getTime();
	
	var predictors = predictorSet.data;
	var results = [];
	
	for (var i in predictors) {
		for (var j in predictors[i]) {
			predictors[i][j] = (predictors[i][j] - this.normalization.input[j].min) / (this.normalization.input[j].max - this.normalization.input[j].min);
		}
	}
		
	for (var i in predictors) {
		results.push(this.perceptron.activate(predictors[i])[0] * (this.normalization.output.max - this.normalization.output.min) + this.normalization.output.min);	
	}
	
    var end = new Date().getTime();
    
    var prediction = {
        results : results,
        size : results.length,
        time : {
            total : end - start,
            avg : (end - start) / predictorSet.data.length 
        }
    }
    	
    if (cb) {
        cb(prediction);
    } else {
        return prediction;
    }	
}


Mlp.prototype.test = function (testSet, cb) {
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

module.exports = Mlp;

