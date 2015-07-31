/**
 * Leaner
 * Train a model 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var SCA = require('service-component');
var Learner = new SCA.Component('Learner', '../composite.json.tmp');

var countReports = 0;

/**
 * Train a model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.params  {modelId}
 * @request.body    {trainingSet : {data, results}}
 * @reply           {modelId, reportId}
 */
Learner.services.train = function (request, reply) {
    var modelId = request.params.modelId;
    var trainingSet = request.body.trainingSet;
    var reportId = countReports;
    reply({modelId : modelId, reportId : reportId});
    Learner.consume.train('model_'+modelId, null, { trainingSet : trainingSet }, function (data) {
        var report = data.report;
        report.modelId = modelId;
        report.reportId = reportId;
        Learner.consume.storeReport(null, {report : report});
    }); 
    countReports++;
}
