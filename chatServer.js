var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')();
var session = require('express-session');
var multer = require('multer');
var upload = multer();

var app = express();
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser);
app.use(session({secret: 'qwertyuiop'
}))

app.get('/',function(req,res) {
  console.log(req.session.username);
  if(req.session.username == undefined) {
    res.redirect('/login');
  }
  else
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/login',function(req,res) {
  res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/signup',function(req,res) {
  res.sendFile(path.join(__dirname + '/signup.html'));
})

app.get('/logout',function(req,res) {
  req.session.username = undefined;
  res.redirect('/');
})

app.post('/signup',function(req,res) {
  if(signup(req.body.password,req.body.username) == true) {
    res.send("Sign up completed");
  }
  else {
    res.send("Invalid Username");
  }
  res.end();
})

app.post('/login', function(req,res) {
  console.log(req.body);
  if(login(req.body.password, req.body.username) == true) {

    req.session.username = req.body.username;
    res.redirect('/');
  }
  else {
    res.send('/login');
    res.end();
  }
})
var httpServer = http.createServer(app).listen(4000, function(req,res) {
  console.log('Socket IO server has been started');
});

var io = require('socket.io').listen(httpServer);

io.use(function(socket,next) {
  console.log(socket.id);
  var req = socket.handshake;
  var res = {};
    console.log(socket.id);
  cookieParser(req, res, function(err) {
    if(err) {
      return next(err);
    }
    session(req, res, next);
  })
})

io.sockets.on('connection',function(socket) {
  console.log('socket ' + socket.handshake.session);
  socket.emit('toclient',{msg:'welcome!'});
  socket.on('fromclient',function(data) {
    socket.broadcast.emit('toclient',data);
    socket.emit('toclient',data);
    console.log('Message from client : '+data.name+ ' : '+data.msg);
  })
});

var users = [
  {
    username: 'hello',
    password: 'world'
  }
];

function login(password, username) {
  for(var i=0;i<users.length;i++)
  {
    if(users[i].username == username) {
      if(users[i].password == password) {
        return true;
      }
    }
  }
  return false;
}

function signup(password, username) {
  for(var i=0;i<users.length;i++)
  {
    if(users[i].username == username) {
      return false;
    }
  }
  users.push({username: username, password: password});
  return true;
}
