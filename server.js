'use strict';

var PORT = process.env.PORT || 8888;

var express = require('express'),
    fs = require('fs'),
    http = require('http');

// Start the web server:
var app = express();

app.use('/', express.static(__dirname));
app.listen(PORT, function() {
  console.info('Server listening on port %d.', PORT);
});
