var express = require('express');
// var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();
app.use(express.static(path.join(__dirname + '/public')));

app.get('/', function(req,res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

var httpServer = http.createServer(app).listen(4000,function(req,res) {
  console.log('Socket IO server has been started');
});

var io = require('socket.io').listen(httpServer);

io.sockets.on('connection',function(socket) {
  socket.emit('toclient',{msg:'welcome!'});
  socket.on('fromclient',function(data) {
    socket.broadcast.emit('toclient',data);
    socket.emit('toclient',data);
    console.log('Message from client :'+data.name+' : '+data.msg);
  })
});



