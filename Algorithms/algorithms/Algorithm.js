/**
 * Algorithm
 * Class that defines how an algorithm should behave
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */
 
var utils = require('./libs/utils.js');

var Algorithm = function (modelParams) {
    var self = this;
    self.model = modelParams;
    setTimeout(function () {
        self.buildAlgorithm = require('./' + modelParams.algorithm + '.js');
        self.algorithm = new self.buildAlgorithm(self.model.parameters);
    }, 2000);
}

/**
 * Train the model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @param   { data, results }
 * @return  Boolean
 */
Algorithm.prototype.train = function (trainingSet, cb) {
    this.algorithm.train(trainingSet, cb);
}

/**
 * Run prediction algorithm
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @param   { data }
 * @return  { results, errors }
 */
Algorithm.prototype.predict = function (predictorSet, cb) {
    var start = new Date().getTime();
    this.algorithm.predict(predictorSet, function (results) {
        var end = new Date().getTime();
        prediction = {
            results : results,
            time : {
                total : end - start,
                avg : (end - start)/predictorSet.data.length,
            },
            size : predictorSet.data.length
        }
        cb(prediction);
    });
}


/**
 * Validate the model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @request.body    { trainingSet : { data, results } }
 * @reply           { errors, time }
 */
Algorithm.prototype.validate = function (trainingSet, cb) {   
    if (this.algorithm.validate) this.algorithm.validate(trainingSet, cb);
    else {
        var self = this;
        var start = new Date().getTime();
        
        var folds = self.model.validation && self.model.validation.folds || 10;
            
        var dataLength = trainingSet.data.length;
        var foldLength = parseInt(dataLength / folds);
        var validation = [];
        
        for (var i = 0; i < folds; i++) {
            var data = utils.cloneArray(trainingSet.data);
            var results = utils.cloneArray(trainingSet.results);
            var dataFold = data.splice(i * foldLength, foldLength);
            var resultsFold = results.splice(i * foldLength, foldLength);

            var algorithm = new self.buildAlgorithm(self.model.parameters);
            algorithm.train({ data : data, results : results });

            var prediction = algorithm.predict({ data : dataFold });
            validation.push({real : resultsFold, results : results});
        }
        
        var end = new Date().getTime();
        
        var sum = 0;
        var sumsq = 0;
        
        for (var i in validation) {
            for (var j in validation[i].real) {
                var error = Math.abs(validation[i].real[j] - validation[i].results[j]);
                var sq = parseFloat(error * error);
                sum += error;
                sumsq += sq;
            }
        }
        
        var report = { 
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
            
        cb(report);
    } 
}

/**
 * Run test algorithm
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @param   { data, results }
 * @return  { results, errors }
 */
Algorithm.prototype.test = function (testSet, cb) {
    if (this.algorithm.test) this.algorithm.test(trainingSet, cb);
    else {
        var start = new Date().getTime();
        var results = this.algorithm.predict(testSet);
        
        var sum = 0;
        var sumsq = 0;
        var dataLength = testSet.data.length;
        
        for (var i in results) {
            var error = Math.abs(results[i] - testSet.results[i]);
            var sq = parseFloat(error * error);
            sum += error;
            sumsq += sq;
        }
        
        var end = new Date().getTime();
        
        var test = {
            results : results,
            errors : { 
                mse : sumsq/dataLength,
                std : Math.sqrt(sumsq/dataLength),
                mean : sum/dataLength
            },
            time : {
                total : end - start,
                avg : (end - start) / dataLength
            },
            size : dataLength
        }
            
        cb(test);
    }
}

module.exports = Algorithm;
