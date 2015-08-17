/**
 * Validator
 * Validate a model 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var SCA = require('service-component');
var Validator = new SCA.Component('Validator', __dirname + '/../composites/model-'+process.argv[2]+'.json');
var Algorithm = require('../algorithms/Algorithm.js');
var algorithm = new Algorithm(Validator.artifacts.getProperty('model'));

/**
 * Validate the model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @request.body    { trainingSet : { data, results } }
 * @reply           { report : { errors, time } }
 */
Validator.services.validate = function (request, reply) {
    algorithm.validate(request.body.trainingSet, function (data) {
        reply({ report : {
            results : data.results,
            errors : data.errors,
            time : data.time,
            size : data.size
        }});
    });
}
