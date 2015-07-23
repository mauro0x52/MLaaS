/**
 * Algorithm
 * Create an instance of an Algorithm 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var Algorithm = function (component) {
    var self = this;
    setTimeout(function () {
        var model = component.artifacts.getProperty('model');
        var BuildAlgorithm = require('./' + model.algorithm + '.js');
        self.algorithm = new BuildAlgorithm(model.parameters);
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
 * Validate the model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @request.body    { trainingSet : { data, results } }
 * @reply           { errors, time }
 */
Algorithm.prototype.validate = function (trainingSet, cb) {
    this.algorithm.validate(trainingSet, cb);
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
    this.algorithm.test(testSet, cb);
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
    this.algorithm.predict(predictorSet, cb);
}

module.exports = Algorithm;
