'use strict';

var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var port = process.env.port || 1337;
var path = require('path');

app.engine('handlebars', exphbs({defaultLayout: 'comingsoonlandingpage'}));
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'views/layouts')));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/test', function (req, res) {
    res.render('home', {layout: 'homepage.handlebars'});
});

app.get('/helloworld', function (req, res) {
    res.render('home', {layout: 'simpleMain.handlebars'});
});

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});