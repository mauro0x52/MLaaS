/**
 * ReportsStorage
 * Store reports 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var SCA = require('sca.js');
var ReportsStorage = new SCA.Component('ReportsStorage', '../composite.json.tmp');

var reports = [];

/**
 * Store a report
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.body    { modelId, reportId, report }
 * @reply           { modelId, reportId }
 */
ReportsStorage.services.storeReport = function (request, reply) {
    var report = request.body.report;
    reports.push(report);
    reply({ modelId : report.modelId, reportId : report.reportId });
}

/**
 * Get a report
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.params  { reportId }
 * @reply           { report }
 */
ReportsStorage.services.getReport = function (request, reply) {
    var reportId = request.params.reportId;
    var found = false;
    var report = {};
    for (var i in reports) {
        if (reports[i].reportId == reportId) {
            found = true;
            report = reports[i];
            break;
        }
    }
    reply(found ? { report : report } : {});
}
