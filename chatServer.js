'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')();
var session = require('express-session')({secret:'qwertyuiop'});
var flash = require('connect-flash');

var app = express();
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser);
app.use(session);
app.use(flash());

app.set('view engine','ejs');

app.use('/', require('./route.js'));

var httpServer = http.createServer(app).listen(4000, function(req,res) {
	console.log('Socket IO server has been started');
});

var io = require('./socket.js')(httpServer, session);
