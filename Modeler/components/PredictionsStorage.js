/**
 * PredictionsStorage
 * Store predictions and tests 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var SCA = require('service-component');
var PredictionsStorage = new SCA.Component('PredictionsStorage', '../composite.json.tmp');

var predictions = [];
var tests = [];


/**
 * Store a test
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.body    { modelId, testId, test }
 * @reply           { modelId, testId }
 */
PredictionsStorage.services.storeTest = function (request, reply) {
    var test = request.body.test;
    tests.push(test);
    reply({modelId : test.modelId, testId : test.testId});
}

/**
 * Get a Test
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.params  { testId }
 * @reply           { test }
 */
PredictionsStorage.services.getTest = function (request, reply) {
    var testId = request.params.testId;
    var found = false;
    var test = {};
    for (var i in tests) {
        if (tests[i].testId == testId) {
            found = true;
            test = tests[i];
            break;
        }
    }
    reply(found ? { test : test } : {});
}
/**
 * Store a prediction
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.body    { modelId, predictionId, prediction }
 * @reply           { modelId, predictionId }
 */
PredictionsStorage.services.storePrediction = function (request, reply) {
    var prediction = request.body.prediction;
    predictions.push(prediction);
    reply({modelId : prediction.modelId, predictionId : prediction.predictionId});
}

/**
 * Get a prediction
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.params  { predictionId }
 * @reply           { prediction }
 */
PredictionsStorage.services.getPrediction = function (request, reply) {
    var predictionId = request.params.predictionId;
    var found = false;
    var prediction = {};
    for (var i in predictions) {
        if (predictions[i].predictionId == predictionId) {
            found = true;
            prediction = predictions[i];
            break;
        }
    }
    reply(found ? { prediction : prediction } : {});
}
