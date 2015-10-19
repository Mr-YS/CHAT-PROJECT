var express = require('express');
// var routes = require('./routes');
var http = require('http');
var path = require('path');

var cookieParser = require('cookie-parser')();
var session = require('cookie-session')({secret:'secret' };

var app = express();
app.use(express.static(path.join(__dirname + '/public')));
app.use(cookieParser);
app.use(session);

app.get('/', function(req,res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

var httpServer = http.createServer(app).listen(4000,function(req,res) {
  console.log('Socket IO server has been started');
});

var io = require('socket.io').listen(httpServer);

io.sockets.on('connection',function(socket) {
  socket.emit('toclient',{name:'ADMIN.Y$',msg:'welcome!'});
  socket.on('fromclient',function(data) {
    socket.broadcast.emit('toclient',data);
    socket.emit('toclient',data);
    console.log('Message from client :'+data.name+' : '+data.msg);
  })

  io.use(function(socket, next) {
    var req = socket.handshake;
    var res = {};
    cookieParser(req, res, function(err) {
      if(err) return next(err) {
        session(req, res, next);
      });
    });
});



