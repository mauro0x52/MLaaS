var SCA = require('service-component');
var fs = require('fs');

var file = fs.readFileSync('./composite.json', 'utf8');
fs.writeFileSync('./composite.json.tmp', file);

var DeployerComposite = new SCA.Composite('DeployerComposite', './composite.json.tmp');
