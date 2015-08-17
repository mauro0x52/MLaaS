var Svm = require('node-svm');

var Svr = function (params) {
    this.options = {
        gamma : params.gamma || [0.125, 0.5, 1],
        c : params.c || [8, 16, 32],
        epsilon : params.epsilon || [0.001, 0.125, 0.5],
        normalize : params.hasOwnProperty('normalize') ? params.normalize : true,
        reduce : params.hasOwnProperty('reduce') ? params.reduce : true,
        retainedVariance : params.retainedVariance || 0.995,
        kFold: params.kFold || 10
    };
    
    this.svm = new Svm.EpsilonSVR(this.options);
}



Svr.prototype.train = function (originalTrainingSet, cb) {
	var trainingSet = [];
	
    
	for (var i in originalTrainingSet.data) {
		trainingSet.push([originalTrainingSet.data[i], originalTrainingSet.results[i]]);
	}
	
	this.svm.train(trainingSet)
		.spread(function (model, report) {
			cb();
		});
}

Svr.prototype.validate = function (originalTrainingSet, cb) {
	var trainingSet = [];
    var dataLength = originalTrainingSet.data.length;
	var start = new Date().getTime();
	
	for (var i in originalTrainingSet.data) {
		trainingSet.push([originalTrainingSet.data[i], originalTrainingSet.results[i]]);
	}
    	
	this.svm.train(trainingSet)
		.spread(function (model, data) {
            var report = {};            
            report.errors = {
                mean : data.mean,
                std : data.std,
                mse : data.mse
            }
            report.size = dataLength;
			report.time = {
                total : new Date().getTime() - start,
                avg : (new Date().getTime() - start) / dataLength
            }
			cb(report);
		});
}

Svr.prototype.predict = function (trainingSet, cb) {
    var results = [];
    
    for (var i in trainingSet.data) {
        results.push(this.svm.predictSync(trainingSet.data[i]));
    }
    
    if (cb)
        cb(results);
    else
        return results;
}

module.exports = Svr;

