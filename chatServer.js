var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')();
var session = require('express-session')({secret:'qwertyuiop'});
var multer = require('multer');
var upload = multer();
var ios = require('socket.io-express-session');
var flash = require('connect-flash');

var app = express();
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser);
app.use(session);
app.use(flash());

app.set('view engine','ejs');

app.get('/',function(req,res) {
  if(req.session.username == undefined) {
    res.redirect('/login');
  }
  else
  res.render('pages/index');
});

app.get('/login',function(req,res) {
  res.render('pages/login', {
    flash:req.flash('warning')[0]
  });
});

app.get('/signup',function(req,res) {
  res.render('pages/signup');
})

app.get('/logout',function(req,res) {
  req.session.username = undefined;
  res.redirect('/');
})

app.get('/group/:groupname', function(req,res) {

})

app.post('/signup',function(req,res) {
  if(signup(req.body.password,req.body.username) == true) {
    res.redirect('/login');
  }
  else {
    res.send("Invalid Username");
  }
  res.end();
})

app.post('/login', function(req,res) {
  if(login(req.body.password, req.body.username) == true){
    req.session.username = req.body.username;
    res.redirect('/');
  }
  else {
    req.flash('warning','test');
    res.redirect('/login');
    res.end();
  }
})
var httpServer = http.createServer(app).listen(4000, function(req,res) {
  console.log('Socket IO server has been started');
});

var users = [
  {
    username: 'hello',
    password: 'world'
  },
  {
    username: 'test',
    password: 'test'
  },
  {
    username: 'admin',
    password: 'admin'
  }
];

var groups = {
  'main': []
};

var io = require('socket.io').listen(httpServer);
io.use(ios(session));

var date = new Date();

io.sockets.on('connection',function(socket) {
  var username = socket.handshake.session.username;
  if(username == undefined) {
    socket.emit('toclient',{name:"SYSTEM",msg:'YOU MUST LOGIN TO CONTINUE!'})
  }
  else {
    joinGroup('main', socket);
    socket.on('fromclient',function(data) {
      var groupname = socket.handshake.session.group;
      if(data.msg.charAt(0) == "/") {
        commands(data.msg,socket);
      }
      else if(data.msg.charAt(0) == "#") {
        hashCommands(data.msg,socket);
      }
      else {
        data.name = username;
        socket.to(groupname).broadcast.emit('toclient',data);
        socket.emit('toclient',data);
      }
      console.log('Message from client : '+data.name+ ' : '+data.msg);
    })
  }
});

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

// command functions

function joinGroup(groupName, socket) {
  if(groupName.length >= 16){
    socket.emit('toclient',{name : "" , msg : " TOO LONG!"});
    return;
  }
  if(groups[groupName] === undefined) {
    groups[groupName] = [];
  }
  var index = groups[groupName].indexOf(socket.handshake.session.username);
  if(index === -1) {
    groups[groupName].push(socket.handshake.session.username);
    socket.join(groupName);
  }
  socket.to(groupName).broadcast.emit('toclient',{name : "" , msg : "' "+socket.handshake.session.username+ " '" + " Joined. "});
  socket.emit('toclient',{name : "" , msg : "' "+socket.handshake.session.username+ " '" + " Joined. "});
  getGroupsMemberCount();
}

function leaveGroup(groupName, socket) {
  if(groups.groupName !== undefined) {
    var index = groups.groupName.indexOf(socket.handshake.session.username);
    if(index !== -1) {
      socket.leave(groupName);
      joinGroup('main', socket);
    }
  }
}

function getGroupsMemberCount() {
  var msg = '';
  for(var name in groups) {
    msg += name+":"+groups[name].length + ",";
  }
  io.emit('command', {name: 'list', msg: msg });
}

function member(socket) {
  var clients = io.sockets.adapter.rooms[socket.handshake.session.group];
  var msg = '';
  var count = 1;
  msg += "GROUP/CHANNEL-NAME : " + socket.handshake.session.group + "<BR><BR>";
  for(var clientID in clients) {
      msg += (count++) + ". " + io.sockets.connected[clientID].handshake.session.username + "<BR>";
  }
  socket.emit('toclient', { name : "", msg : msg })
}

function adminFinder(socket) {
  var clients = io.sockets.adapter.rooms[socket.handshake.session.group];
  msg += "The Admin of #"+ socket.handshake.session.group +" is "+ io.sockets.connected[0].handshake.session.username + "<BR>";
}

function isAdmin(socket) {
  var clients = io.sockets.adapter.rooms[socket.handshake.session.group];
  var count = 1;
  for(var clientID in clients) {
    if(clientID == socket.id && count == 1) {
      return true;
    }
    return false;
  }
}

function kick(username,groupname) {
  var clients = io.sockets.adapter.rooms[groupname];
  for(var clientID in clients) {
    if(io.sockets.connected[clientID].handshake.session.username == username){
      joinGroup('main',io.sockets.connected[clientID]);
    }
  }
}

function lennyFace(socket, number) {
  var lennyArr = [
    "( ͡° ͜ʖ ͡°)",
    "( ͠° ͟ʖ ͡°)",
    "ᕦ( ͡° ͜ʖ ͡°)ᕤ",
    "( ͡~ ͜ʖ ͡°)",
    "( ͡o ͜ʖ ͡o)",
    "	͡° ͜ʖ ͡ -",
    "( ͡͡ ° ͜ ʖ ͡ °)﻿",
    "(ง ͠° ͟ل͜ ͡°)ง",
    "ᕦ( ͡°╭͜ʖ╮͡° )ᕤ",
    "( ͡°╭͜ʖ╮͡° )",
    "( ‾ʖ̫‾)	",
    "( ͡^ ͜ʖ ͡^)"
  ]
  console.log(number);
  if(number >= lennyArr.length) {
    socket.to(socket.handshake.session.group).emit('toclient',{name : "" , msg : "Requested emoticon is not available."});
  }
  else {
    io.sockets.in(socket.handshake.session.group).emit('toclient',{name : socket.handshake.session.username , msg : lennyArr[number-1]});
  }
}

function location(socket) {
  var currentGroup = socket.handshake.session.group;
  console.log(currentGroup);
  socket.emit('toclient',{name : "" , msg : "CURRENT LOCATION/CHANNEL : "+ currentGroup});
}

var commandList = {
  help: "/group [groupname] - Joining Group/Channel <BR>/"

};

function hashCommands(command, socket) {
  joinGroup(command.substring(1,command.length), socket);
}
function commands(command, socket) {
  var data = {
    name: '',
    msg: ''
  };
  var tokens = command.split(' ');
  switch(tokens[0]) {
    case "/help" :
      if(tokens.length == 1)
        data.msg = commandList.help;
      /*else{
        switch(tokens[1]){
          case "please" :
            data.msg = ;
              break;
        }
      }*/
      socket.emit('toclient',data);
      break;
    case "/group" :
      if(tokens.length >= 2) {
        joinGroup(tokens[1], socket);
      }
      break;
    case "/member" :
      if(tokens.length === 1) {
        member(socket);
      }
      else if(tokens[1] == "admin") {
        adminFinder(socket);
      }
      break;
    case "/kick" :
      if(tokens.length >= 2 && isAdmin(socket)){
        for(var i = 1; i < tokens.length; i++)
        {
          kick(tokens[i],socket.handshake.session.group);
        }
      }
      break;
    case "/quit" :
    case "/exit" :
    case "/escape" :
      if(tokens.length === 1) {
        leaveGroup("main", socket);
      }
      break;
    case "/logout":
    case "/signout":
      data.name = 'logout';
      data.msg = '';
      socket.emit("command",data);
      break;
    case "/location":
    case "/loc":
    case "/whereAmI":
      location(socket);
      break;
    case "/lenny":
    case "/lennyface":
      lennyFace(socket, tokens[1]);
      break;
    default :
      data.msg = command+" is invalid command.";
      socket.emit('toclient',data);
  }
}
