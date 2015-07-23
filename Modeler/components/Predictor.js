/**
 * Predictor
 * Run a model 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var SCA = require('sca.js');
var Predictor = new SCA.Component('Predictor', '../composite.json.tmp');

var countPredictions = 0;
var countTests = 0;

/**
 * Test a model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.params  {modelId}
 * @request.body    {testSet : {data, results}}
 * @reply           {modelId, predictionId}
 */
Predictor.services.test = function (request, reply) {
    var modelId = request.params.modelId;
    var testSet = request.body.testSet;
    var testId = countTests;
    countTests++;
    reply({modelId : modelId, testId : testId});
    Predictor.consume.test('model_'+modelId, null, { testSet : testSet }, function (data) {
        var test = data.test;
        test.modelId = modelId;
        test.testId = testId;
        Predictor.consume.storeTest(null, {test : test});
    }); 
}


/**
 * Run a model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.params  {modelId}
 * @request.body    {predictorSet : {data}}
 * @reply           {modelId, predictionId}
 */
Predictor.services.predict = function (request, reply) {
    var modelId = request.params.modelId;
    var predictorSet = request.body.predictorSet;
    var predictionId = countPredictions;
    countPredictions++;
    reply({modelId : modelId, predictionId : predictionId});
    Predictor.consume.predict('model_'+modelId, null, { predictorSet : predictorSet }, function (data) {
        var prediction = data.prediction;
        prediction.modelId = modelId;
        prediction.predictionId = predictionId;
        Predictor.consume.storePrediction(null, {prediction : prediction});
    }); 
}
