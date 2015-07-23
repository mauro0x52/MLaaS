/**
 * Builder
 * Build a new model 
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 */

var SCA = require('sca.js');
var fs = require('fs');
var fork = require('child_process').fork;
var Builder = new SCA.Component('Builder', '../composite.json.tmp');

/**
 * Number of models created
 */
var numModels = 0;

/**
 * Build a new model
 * 
 * @author  Mauro Ribeiro
 * @since   2015-07-17
 * 
 * @request.body    {model : {algorithm, parameters}}
 * @reply           {model : {modelId, algorithm, parameters}}
 */
Builder.services.build = function (request, reply) {
    var model = request.body.model || {};
    model.modelId = numModels;
    numModels++;
    
    var artifacts = JSON.parse(fs.readFileSync('./../../Algorithms/composite.json', 'utf8'));
    var portPrefix = 21000;
    var port = portPrefix + (model.modelId * 10);
    var modelFilePath = './../../Algorithms/composites/model-'+model.modelId+'.json';
                
    // build artifacts descriptor file 
    artifacts.name = "Model" + model.modelId;
    artifacts.port = port;
    artifacts.properties.model = model;
    artifacts.components.Trainer.port = portPrefix + (model.modelId * 10) + 2;
    artifacts.components.Predictor.port = portPrefix + (model.modelId * 10) + 3;
    artifacts.components.Validator.port = portPrefix + (model.modelId * 10) + 4;
                
    // save descriptor file 
    fs.writeFileSync(modelFilePath, JSON.stringify(artifacts, null, 4));
        
    // fork composite and components 
	fork('./../../Algorithms/Algorithm.js', [model.modelId]);
	fork('./../../Algorithms/components/Trainer.js', [model.modelId]);
	fork('./../../Algorithms/components/Predictor.js', [model.modelId]);
	fork('./../../Algorithms/components/Validator.js', [model.modelId]);
    
    // wait enough time to build 
	setTimeout(function () {
        Builder.artifacts.data.components.Algorithms.instances['model_'+model.modelId] = {
            "host" : "http://localhost",
            "port" : artifacts.port
        }
        Builder.syncArtifacts();
        setTimeout(function () {
            reply({model : model});
        }, 1000);
    }, 1000);
}
