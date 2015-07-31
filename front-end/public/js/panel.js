'use strict';

var app = angular.module('panel', []);

app.controller('panel', function ($scope, $http) {
    var mlaasUrl = 'http://'+window.location.hostname+':20000';
    
    var statusIntervals = {};

    $scope.tab = 'models';
    
    $scope.models = [];
        
	$scope.algorithms = {
		mlp : angular.toJson({ name : 'MLP', algorithm : 'mlp', parameters : {layers : [12, 14, 1], rate : 0.1, iterations : 1000, error: 0.0001}}, true),
		knn : angular.toJson({ name : 'KNN', algorithm : 'knn', parameters : {k : 10, maxDistance : 2, weightFunctionSigma : 100, weights : [1,4,4,7,1,1,4,7,4,4,5,4]}}, true),
		svr : angular.toJson({ name : 'SVR', algorithm : 'svr', parameters : {gamma : [0.125, 0.5, 1], c : [8, 16, 32], epsilon : [0.001, 0.125, 0.5], retainedVariance : 0.995,}}, true)
	}
    
	$scope.forms = {
		model : angular.copy($scope.algorithms.knn),
		trainingSet : angular.toJson({ "data" : [], "results" : [] }, true),
		testSet : angular.toJson({ "data" : [], "results" : [] }, true),
		predictorSet : angular.toJson({ "data" : [] }, true)
	}
    
    $scope.data = {
        trainingSet : {},
        testSet : {},
        predictorSet : {}
    }
    
    $scope.state = {
        model : { add : true },
        trainingSet : { edit : true, executed : false },
        testSet : { edit : true, executed : false },
        predictorSet : { edit : true, executed : false }
    }
    
    /* MODEL */
    
    $scope.addModel = function () {
        var model = JSON.parse($scope.forms.model);
        $scope.state.model.add = false;
        model.report = null;
        model.prediction = null;
        model.test = null;
        model.status = 'building';
        $scope.models.push(model);
		$http.post(mlaasUrl+'/model', { model : JSON.parse($scope.forms.model) }).success(function(data) {
            model.status = 'ready';
            model.modelId = data.model.modelId;
		});
    }
    
	$scope.loadModelInput = function (algorithm) {
		$scope.forms.model = angular.copy($scope.algorithms[algorithm]);
	}
    
    /* EDIT DATA */
    
    $scope.editTrainingSet = function () {
        $scope.state.trainingSet.edit = true;
    }
    
    $scope.editTestSet = function () {
        $scope.state.testSet.edit = true;
    }
    
    $scope.editPredictorSet = function () {
        $scope.state.predictorSet.edit = true;
    }
    
    /* SET DATA */
    
    $scope.setTrainingSet = function () {
        $scope.state.trainingSet.edit = false;
		var jsonData = JSON.parse($scope.forms.trainingSet);
		$scope.data.trainingSet = jsonData;
		$scope.forms.trainingSet = angular.toJson(jsonData, true);
    }
    
    $scope.setTestSet = function () {
        $scope.state.testSet.edit = false;
		var jsonData = JSON.parse($scope.forms.testSet);
		$scope.data.testSet = jsonData;
		$scope.forms.testSet = angular.toJson(jsonData, true);
    }
    
    $scope.setPredictorSet = function () {
        $scope.state.predictorSet.edit = false;
		var jsonData = JSON.parse($scope.forms.predictorSet);
		$scope.data.predictorSet = jsonData;
		$scope.forms.predictorSet = angular.toJson(jsonData, true);
    }
        
    /* ALL MODELS */
    
    $scope.trainAll = function () {
        for (var i in $scope.models) {
            var model = $scope.models[i];
            if (model.status == 'ready') {
                $scope.train(model);
            }
        }
    }
    
    $scope.testAll = function () {
        for (var i in $scope.models) {
            var model = $scope.models[i];
            if (model.status == 'trained') {
                $scope.test(model);
            }
        }
    }
    
    $scope.predictAll = function () {
        for (var i in $scope.models) {
            var model = $scope.models[i];
            if (model.status == 'trained') {
                $scope.predict(model);
            }
        }
    }
    
    $scope.findModel = function (property, value) {
        var found = false;
        for (var i in $scope.models) {
            if ($scope.models[i][property] == value) {
                found = true;
            }
        }
        return found;
    }
    
    /* SINGLE MODEL */
    
    $scope.remove = function (model) {
        if (model.status != 'ready' && model.status != 'building') {
            buildCharts('train');
            buildCharts('test');
            buildCharts('prediction');
        } 
        for (var i in statusIntervals['model'+model.modelId]) clearInterval(statusIntervals['model'+model.modelId][i]);
        $scope.models.splice($scope.models.indexOf(model), 1);
    }
    
    $scope.train = function (model) {
        model.status = 'training';
		$http.post(mlaasUrl+'/model/'+model.modelId+'/train', { trainingSet : $scope.data.trainingSet }).success(function(data) {
            var interval = setInterval(function () {
                $http.get(mlaasUrl+'/report/'+data.reportId).success(function(data) {
                    if (data.hasOwnProperty('report')) {
                        clearInterval(interval);
                        model.status = 'trained';
                        model.report = data.report;
                        for (var i in model.report.results) {
                            model.report.results[i] = parseFloat(model.report.results[i]);
                        }
                        buildCharts('train');
                        $scope.state.trainingSet.executed = true;
                    }
                });
            }, 2000);
            if (statusIntervals.hasOwnProperty('model'+model.modelId) == false) statusIntervals['model'+model.modelId] = []; 
            statusIntervals['model'+model.modelId].push(interval);
		});
    }
    
    $scope.test = function (model) {
        model.status = 'testing';
		$http.post(mlaasUrl+'/model/'+model.modelId+'/test', { testSet : $scope.data.testSet }).success(function(data) {
            var interval = setInterval(function () {
                $http.get(mlaasUrl+'/test/'+data.testId).success(function(data) {
                    if (data.hasOwnProperty('test')) {
                        clearInterval(interval);
                        model.status = 'trained';
                        model.test = data.test;
                        for (var i in model.test.results) {
                            model.test.results[i] = parseFloat(model.test.results[i]);
                        }
                        buildCharts('test');
                        $scope.state.testSet.executed = true;
                    }
                });
            }, 2000);
            if (statusIntervals.hasOwnProperty('model'+model.modelId) == false) statusIntervals['model'+model.modelId] = []; 
            statusIntervals['model'+model.modelId].push(interval);
		});
    }
    
    $scope.predict = function (model) {
        model.status = 'predicting';
		$http.post(mlaasUrl+'/model/'+model.modelId+'/predict', { predictorSet : $scope.data.predictorSet }).success(function(data) {
            var interval = setInterval(function () {
                $http.get(mlaasUrl+'/prediction/'+data.predictionId).success(function(data) {
                    if (data.hasOwnProperty('prediction')) {
                        clearInterval(interval);
                        model.status = 'trained';
                        model.prediction = data.prediction;
                        for (var i in model.prediction.results) {
                            model.prediction.results[i] = parseFloat(model.prediction.results[i]);
                        }
                        buildCharts('prediction');
                        $scope.state.predictorSet.executed = true;
                    }
                });
            }, 2000);
            if (statusIntervals.hasOwnProperty('model'+model.modelId) == false) statusIntervals['model'+model.modelId] = []; 
            statusIntervals['model'+model.modelId].push(interval);
		});
    }
    
    
	var buildCharts = function (name) {
        var params = {
            name : 'train',
            dataSet : 'trainingSet',
            property : 'report'
        };
        
        if (name == 'test') {
            params = {
                name : 'test',
                dataSet : 'testSet',
                property : 'test'
            };
        } else if (name == 'prediction') {
            params = {
                name : 'prediction',
                dataSet : 'predictorSet',
                property : 'prediction'
            };
        }
        
        if (name != 'train') {
            var lineChart = {
                x : [], 
                y : []
            }
            for (var i = 0; i < $scope.data[params.dataSet].data.length; i++) {
                lineChart.x.push(i+1);
            }
            //var colors = ['#66ddee','#ee9955','#aaee66']
            var colors = [];
            for (var i in $scope.models) {
                var model = $scope.models[i];
                if (model[params.property]) {
                    lineChart.y.push({
                        name : model.name,
                        data : model[params.property].results
                    });
                }
            }
            
            if (name != 'prediction') {
                lineChart.y.push({name : 'measured', data : $scope.data[params.dataSet].results, color : '#CCCCCC', dashStyle : 'ShortDash'});
            }
        }
        
        if (name != 'prediction') {
            var barCharts = { mean : [], mse : [], time : [] }
            for (var i in $scope.models) {
                if ($scope.models[i][params.property]) {
                    barCharts.mean.push([$scope.models[i].name, parseFloat($scope.models[i][params.property].errors.mean)]);
                    barCharts.mse.push([$scope.models[i].name, parseFloat($scope.models[i][params.property].errors.mse)]);
                    barCharts.time.push([$scope.models[i].name, parseFloat($scope.models[i][params.property].time.total)]);
                }
            } 
        }
				
		setTimeout(function() {
            if (name != 'train') {
                $('#'+params.name+'-linechart').highcharts({
                    //colors : colors,
                    title: null,
                    xAxis: {
                        categories: lineChart.x
                    },
                    yAxis: {
                        plotLines: [{
                            value: 0,
                            width: 1,
                            color: '#808080'
                        }],
                        title : null
                    },
                    legend: {
                        layout: 'vertical',
                        align: 'right',
                        verticalAlign: 'middle',
                        borderWidth: 0
                    },
                    series: lineChart.y,
                    credits: {
                        enabled: false
                    }
                });
            }
			
            if (name != 'prediction') {
                for (var i in barCharts) {
                    var title = '';
                    if (i == 'mean') title = 'Mean Absolute Errors';
                    else if (i == 'mse') title = 'Mean Square Errors';
                    else if (i == 'time') title = 'Running Time (ms)';
                    $('#'+params.name+'-'+i+'-chart').highcharts({
                        //colors : colors,
                        chart: {
                            type: 'column'
                        },
                        title: {
                            text: title,
                            style: {
                                fontSize : '14px'
                            }
                        },
                        xAxis: {
                            type: 'category'
                        },
                        yAxis: {
                            min: 0,
                            title : null
                        },
                        legend: {
                            enabled: false
                        },
                        series: [{
                            colorByPoint: true,
                            data: barCharts[i]
                        }],
                        credits: {
                            enabled: false
                        }
                    });
                }
            }
		}, 200);
    }
});

/*
app.controller('panel', function ($scope, $http) {
    var mlaasUrl = 'http://'+window.location.hostname+':10000';
    
	$scope.models = [];
	$scope.predictions = [];
	$scope.tab = 'post-model';
	$scope.responses = {
		postModel : null,
		postTrainingSet : null,
		postPredictorSet : null,
		getPreProcessedData : null,
		getPredictedData : null
	}	
	trainingSet = trainingSet ? trainingSet : {data : [], results: []};
	var testSteps = 280;//58
	var testRange = 20;
	var testIndex = trainingSet.data.length - testRange - testSteps;
	//var testIndex = parseInt(Math.random()*(trainingSet.data.length - 20));
	var testSet = trainingSet.data.slice().splice(testIndex, testRange);
	var testResultsSet = trainingSet.results.slice().splice(testIndex, testRange);
	
	$scope.algorithms = {
		mlp : angular.toJson({ model : {algorithm : 'mlp', parameters : {layers : [12, 14, 1], rate : 0.1, iterations : 1000, error: 0.0001}}}, true),
		knn : angular.toJson({ model : {algorithm : 'knn', parameters : {k : 10, maxDistance : 2, weightFunctionSigma : 100, weights : [1, 1000, 1000, 1000000, 1, 1, 1000, 1000000, 1000, 1000, 10000, 1000]}}}, true),
		svm : angular.toJson({ model : {algorithm : 'svm', parameters : {gamma : [0.125, 0.5, 1], c : [8, 16, 32], epsilon : [0.001, 0.125, 0.5], retainedVariance : 0.995,}}}, true)
	}
	
	$scope.forms = {
		postModel : { 
			data : angular.copy($scope.algorithms.mlp)
		},
		postTrainingSet : { 
			modelId : null, 
			data : angular.toJson(trainingSet)
		},
		getReport : {
			modelId : null
		},
		postPredictorSet : { 
			modelId : null, 
			data : angular.toJson({ data : testSet}) 
		},
		getPreProcessedData : { 
			modelId : null 
		},
		getPredictedData : { 
			modelId : null, 
			predictionId : null 
		}
	}
	
	$scope.data = {};
	
	$http.get('/config').success(function(data) {
		config = data;
	});
	
	var setModelId = function (modelId) {
		$scope.forms.postTrainingSet.modelId = modelId;
		$scope.forms.getReport.modelId = modelId;
		$scope.forms.postPredictorSet.modelId = modelId;
		$scope.forms.getPreProcessedData.modelId = modelId;
		$scope.forms.getPredictedData.modelId = modelId;
	}
	
	var getModel = function (modelId) {
		for (var i in $scope.models) {
			if ($scope.models[i].modelId == modelId) return $scope.models[i];
		}
	}
	
	var getPrediction = function (predictionId) {
		for (var i in $scope.predictions) {
			if ($scope.predictions[i].predictionId == predictionId) return $scope.predictions[i];
		}
	}
	
	$scope.loadModelInput = function (algorithm) {
		$scope.forms.postModel.data = angular.copy($scope.algorithms[algorithm]);
		$scope.responses.postModel = null;
	}
	
	$scope.postModel = function () {
		var jsonData = JSON.parse($scope.forms.postModel.data);
		$scope.forms.postModel.data = angular.toJson(jsonData, true);
		$scope.responses.postModel = null;
		$http.post(mlaasUrl+'/models', JSON.parse($scope.forms.postModel.data)).success(function(data) {
			$scope.responses.postModel = data;
			var model = {modelId : data.modelId, algorithm : jsonData.model.algorithm, status : 'building', report : null, predictions : [] };
			$scope.models.push(model);
			setModelId(data.modelId);
			getStatus(model);
		});
	}
	
	$scope.postTrainingSet = function () {
		var postData = angular.toJson(JSON.parse($scope.forms.postTrainingSet.data));
		$scope.forms.postTrainingSet.data = postData;
		$scope.responses.postTrainingSet = null;
		$http.post(mlaasUrl+'/models/'+$scope.forms.postTrainingSet.modelId+'/training-set', postData).success(function(data) {
			$scope.responses.postTrainingSet = data;
			setModelId($scope.forms.postTrainingSet.modelId);
		});
	}
	
	$scope.getReport = function () {
		$scope.responses.getReport = null;
		var modelId = $scope.forms.getReport.modelId;
		$http.get(mlaasUrl+'/models/'+modelId+'/report').success(function(data) {
			$scope.responses.getReport = data;
			getModel(modelId).report = data.report;
			setModelId($scope.forms.getReport.modelId);
		});
	}
	
	$scope.postPredictorSet = function () {
		var postData = angular.toJson(JSON.parse($scope.forms.postPredictorSet.data));
		var modelId = $scope.forms.postPredictorSet.modelId;
		$scope.forms.postPredictorSet.data = postData;
		$scope.responses.postPredictorSet = null;
		$http.post(mlaasUr+'/models/'+modelId+'/predictor-set', postData).success(function(data) {
			$scope.responses.postPredictorSet = data;
			$scope.forms.getPredictedData.predictionId = data.predictionId;
			setModelId($scope.forms.postPredictorSet.modelId);
			getModel(modelId).predictions.push(data.predictionId);
		});
	}
	
	$scope.getPredictedData = function () {
		$scope.responses.getPredictedData = null;
		var predictionId = $scope.forms.getPredictedData.predictionId;
		$http.get(mlaasUrl+'/predictions/'+predictionId).success(function(data) {
			$scope.responses.getPredictedData = data;
			$scope.predictions.push(data);
		});
	}
	
	var getStatus = function (model) {
		setInterval(function () {
			var gotReply = false;
			$http.get(mlaasUrl+'/models/'+model.modelId+'/status').success(function(data) {
				gotReply = true;
				model.status = data.status == 'ready' ?  'ready' : '';
			}, {timeout : 500});
			if (gotReply == false) model.status = '';
		}, 1000);
	}
	
	$scope.printJSON = function (json) {
		return json ? angular.toJson(json, true) : '';
	}
	
	$scope.buildCharts = function () {
		var predictionChart = {
			x : [], 
			y : []
		}
		for (var i = 0; i < testSet.length; i++) {
			predictionChart.x.push(i+1);
		}
		var colors = ['#66ddee','#ee9955','#aaee66']
		for (var i in $scope.models) {
			for (var j in $scope.models[i].predictions) {
				var prediction = getPrediction($scope.models[i].predictions[j]);
				predictionChart.y.push({
					name : $scope.models[i].modelId +'. '+$scope.models[i].algorithm+')',
					data : prediction.prediction
				});
				$scope.models[i].time = prediction.time;
				var mean = 0;
				var mse = 0;
				for (var k in prediction.prediction) {
					var error = Math.abs(prediction.prediction[k] - testResultsSet[k]);
					var sq = parseFloat(error * error);
					mean += error;
					mse += sq;
					mean = mean + Math.abs(prediction.prediction[k] - testResultsSet[k]);
				}
				mean = mean/prediction.prediction.length;
				mse = mse/prediction.prediction.length;
				$scope.models[i].test = {
					time : prediction.time,
					mse : mse,
					std : Math.sqrt(mse),
					mean : mean
				}
			}
		}
		predictionChart.y.push({name : 'real', data : testResultsSet, color : '#CCCCCC', dashStyle : 'ShortDash'});
		
		
		var validationMeanChart = [];
		var testMeanChart = [];
		for (var i in $scope.models) {
			validationMeanChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].report.mean]);
			testMeanChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].test.mean]);
		}
		
		var validationMseChart = [];
		var testMseChart = [];
		for (var i in $scope.models) {
			validationMseChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].report.mse]);
			testMseChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].test.mse]);
		}
		
		var validationTimeChart = [];
		var testTimeChart = [];
		for (var i in $scope.models) {
			validationTimeChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].report.time]);
			testTimeChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].test.time]);
		}
		
		
		setTimeout(function() {
			$('#predictions-chart').highcharts({
				colors : colors,
				title: {
					text: 'Predictions'
					//x: -20 //center
				},
				xAxis: {
					categories: predictionChart.x
				},
				yAxis: {
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}]
				},
				legend: {
					layout: 'vertical',
					align: 'right',
					verticalAlign: 'middle',
					borderWidth: 0
				},
				series: predictionChart.y
			});
			
			
			$('#validation-mean-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Validation Mean Errors'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Mean Error'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: validationMeanChart
				}]
			});
			
			$('#validation-mse-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Validation MSEs'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'MSE'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: validationMseChart
				}]
			});
			
			$('#validation-time-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Validation Time'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Time (ms)'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: validationTimeChart
				}]
			});
			
			$('#test-mean-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Testing Mean Errors'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Mean Error'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: testMeanChart
				}]
			});
			
			$('#test-mse-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Testing MSEs'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'MSE'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: testMseChart
				}]
			});
			
			$('#test-time-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Testing Time'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Time (ms)'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: testTimeChart
				}]
			});
			
		}, 200);
	}
});
*/
