'use strict';

var express = require('express');
var bodyparser = require('body-parser');

var app = new express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

app.use('/', express.static('public'));

var server = app.listen(8888);

