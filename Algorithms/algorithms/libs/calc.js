var Calc = {};

Calc.euclidean = function (x1, x2) {
	var i;
	var distance = 0;
	for (i = 0; i < x1.length; i++) {
		var d = x1[i] - x2[i];
		distance += d * d;
	}
	return Math.sqrt(distance);
}

Calc.weightedEuclidean = function (x1, x2, weights) {
	var i;
	var distance = 0;
	for (i = 0; i < x1.length; i++) {
		var d = x1[i] - x2[i];
		if (weights[i] != 0) {
			distance += d * d / weights[i];
		} 
	}
	return Math.sqrt(distance);
}

Calc.gaussian = function (x, sigma) {
	return Math.exp(-1.*x*x/(2*sigma*sigma))
}

module.exports = Calc;
