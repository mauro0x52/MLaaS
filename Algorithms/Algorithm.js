var SCA = require('service-component');
var Algorithm = new SCA.Composite('Algorithm', __dirname + '/composites/model-'+process.argv[2]+'.json');
