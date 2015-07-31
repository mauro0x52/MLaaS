/**
 * Predictor
 * Run a model 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var SCA = require('service-component');
var Predictor = new SCA.Component('Predictor', __dirname + '/../composites/model-'+process.argv[2]+'.json');
var Algorithm = require('../algorithms/Algorithm.js');
var algorithm = new Algorithm(Predictor);

/**
 * Train the model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @request.body    { trainingSet : { data, results } }
 * @reply           { report : { errors, time } }
 */
Predictor.services.train = function (request, reply) {
    algorithm.train(request.body.trainingSet, function (data) {
        reply({});
    });
}


/**
 * Run test algorithm
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @request.body    { testSet : { data, results } }
 * @reply           { test : { results, errors } }
 */
Predictor.services.test = function (request, reply) {
    algorithm.test(request.body.testSet, function (data) {
        reply({
            test : {
                results : data.results,
                errors : data.errors,
                time : data.time,
                size : data.size
            }
        });
    });
}

/**
 * Run prediction algorithm
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @request.body    { predictorSet : { data } }
 * @reply           { prediction : { results, errors } }
 */
Predictor.services.predict = function (request, reply) {
    algorithm.predict(request.body.predictorSet, function (data) {
        reply({
            prediction : {
                results : data.results,
                time : data.time,
                size : data.size
            }
        });
    });
}
