var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')();
var session = require('express-session')({secret:'qwertyuiop'});
var multer = require('multer');
var upload = multer();
var ios = require('socket.io-express-session');

var app = express();
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser);
app.use(session);

app.set('view engine','ejs');

app.get('/',function(req,res) {
  console.log(req.session.username);
  if(req.session.username == undefined) {
    res.redirect('/login');
  }
  else
  res.render('pages/index');
});

app.get('/login',function(req,res) {
  res.render('pages/login');
});

app.get('/signup',function(req,res) {
  res.render('pages/signup');
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

io.use(ios(session));

io.sockets.on('connection',function(socket) {
  var username = socket.handshake.session.username;
  if(username == undefined) {
    socket.emit('toclient',{name:"SYSTEM",msg:'YOU MUST LOGIN TO CONTINUE'})
  }
  else {
    console.log('socket ' + username);
    socket.emit('toclient',{name : "" , msg : "' "+username+ " '" + " Joined. "});
    socket.on('fromclient',function(data) {
      if(data.msg.charAt(0) == "/") {
        commands(data.msg,socket);
      }
      else {
        data.name = username;
        socket.broadcast.emit('toclient',data);
        socket.emit('toclient',data);
      }
      console.log('Message from client : '+data.name+ ' : '+data.msg);
    })
  }
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

var commandList = {
  help: ""
};

function commands(command, socket){
  var data = {
    name: '',
    msg: ''
  };
  var tokens = command.split(' ');
  switch(tokens[0]) {
    case "/help" :
    if(tokens.length == 1)
      data.msg = commandList.help;
    else{
      switch(tokens[1]){
        case "please" :
          data.msg = "COMMANDS1";
        break;
      }
    }
    break;
    default :
      data.msg = command+" IS INVALID COMMAND";
  }
  socket.emit('toclient',data);
}
