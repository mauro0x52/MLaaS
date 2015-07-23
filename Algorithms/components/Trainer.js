/**
 * Trainer
 * Train and validate a model 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var SCA = require('sca.js');
var Trainer = new SCA.Component('Trainer', __dirname + '/../composites/model-'+process.argv[2]+'.json');

/**
 * Train Predictor and Validator
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-20
 * 
 * @request.body    { trainingSet : { data, results } }
 * @reply           { report : { errors, time } }
 */
Trainer.services.train = function (request, reply) {
    Trainer.consume.trainPredictor(null, request.body);
    Trainer.consume.validate(null, request.body, function (data) {
        reply({ report : data.report });
    });
}
