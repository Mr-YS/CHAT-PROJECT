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
var fs = require('fs');
var knex = require('knex')({
	client: 'mysql',
	connection: {
		host: 'localhost',
		user: 'chatProject',
		password: fs.readFileSync(__dirname + '/.password').toString().trim(),
		database: 'chatProject'
	}
});

var User = require('./user.js');
var Group = require('./group.js');

var crypto = require('crypto');

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
	else {
		res.redirect('/hub');
	}
});

app.get('/login',function(req,res) {
	res.render('pages/login', {
		flash:req.flash('warning')[0]
	});
});

app.get('/signup',function(req,res) {
	res.render('pages/signup');
});

app.get('/hub', function(req, res) {
	if(req.session.username == undefined) {
		res.redirect('/login');
	}
	else {
		knex('group').then(function(rows) {
			res.render('pages/hub', {
				groups: rows
			});
		});
	}
});

app.get('/logout',function(req,res) {
	req.session.username = undefined;
	res.redirect('/');
})

app.get('/group/:groupname', function(req,res) {
	if(req.session.username == undefined) {
		res.redirect('/login');
	}
	else {
		res.render('pages/index');
	}
})

app.post('/signup',function(req,res) {
	knex('user').where('username', req.body.username).then(function(rows) {
		if(rows.length === 0) {
			var hmac = crypto.createHmac('sha1','!yoonsang?|');
			hmac.setEncoding('hex'); 
			hmac.write(req.body.password);
			hmac.end();
			var password = hmac.read();
			knex('user').insert({
				username: req.body.username,
				password: password
			}).then(function(id) {
				res.redirect('/login');
			});
		}
		else {
			res.send("Invalid Username");
			res.end();
		}
	});
})

app.post('/login', function(req,res) {
	knex('user').where('username', req.body.username).then(function(rows) {
		var hmac = crypto.createHmac('sha1','!yoonsang?|');
		hmac.setEncoding('hex');
		hmac.write(req.body.password);
		hmac.end();
		var password = hmac.read();
		if(rows.length === 1 && rows[0].password === password) {
			req.session.username = req.body.username;
			res.redirect('/hub');
		}
		else {
			req.flash('warning','test');
			res.redirect('/login');
			res.end();
		}
	});
});

app.post('/hub', function(req, res) {
	knex('group').where('groupname', req.body.groupname).then(function(rows) {
		if(rows.length === 1) {
			if(rows[0].password == req.body.password) {
				res.redirect('/group/' + req.body.groupname);
			}
			else {
				res.redirect('/hub');
			}
		}
		else {
			res.redirect('/hub');
		}
	});
});
var httpServer = http.createServer(app).listen(4000, function(req,res) {
	console.log('Socket IO server has been started');
});

var groups = {
	main : new Group('main',undefined),
};
var users = {};

function getGroupsMemberCount() {
	var msg = '';
	for(var name in groups) {
		msg += name+":"+groups[name].members.length + ",";
	}
	console.log(msg);
	io.emit('command', {name: 'list', msg: msg });
}

var io = require('socket.io').listen(httpServer);
io.use(ios(session));

var date = new Date();

io.sockets.on('connection',function(socket) {
	var username = socket.handshake.session.username;
	if(username == undefined) {
		socket.emit('toclient',{name:"SYSTEM",msg:'YOU MUST LOGIN TO CONTINUE!'})
	}
	else {
		socket.on('connect1',function(data) {
			var user = new User(username, socket, data.groupname);
			users[socket.id] = user;
			if(!groups.hasOwnProperty(data.groupname)) {
				groups[data.groupname] = new Group(data.groupname, user);
			}
			groups[data.groupname].addUser(user, data.password);
			getGroupsMemberCount();
		});
		socket.on('disconnect', function(data) {
			var user = users[this.id];
			if(user !== undefined) {
				groups[user.group].removeUser(user);
			}
			getGroupsMemberCount();
		})
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
				//socket.broadcast.emit('toclient',data);
				//socket.emit('toclient',data);
			}
			console.log('Messiage from client : '+data.name+ ' : '+data.msg);
		})
	}
});

// command functions

function leaveGroup(groupName, socket) {
	if(groups.groupName !== undefined) {
		var index = groups.groupName.indexOf(socket.handshake.session.username);
		if(index !== -1) {
			socket.leave(groupName);
			joinGroup('main', socket);
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
		socket.to(socket.handshake.session.group).emit('toclient',{name : "" , msg : "Requested lennyFace is not available."});
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
	help: "/group [groupname] , #[groupname] -	Join the Group/Channel <BR>/member , /who - Show The List of Current Users in the Channel. <BR>/quit , /exit , /leave , /escape , /esc , /q - Leave the Channel <BR>/logout , /signout, /lg - Logout<BR>/location , /loc , /cd - Your Current Location<BR>/lenny [number] , /lennyFace [number] , /lol [number] - Lenny Emoticon "
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
				data.name = 'group';
				data.msg = tokens[1];
				socket.emit("command",data);
			}
			break;
		case "/member":
		case "/who":
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
		case "/leave" :
		case "/esc" :
		case "/q" :
			if(tokens.length === 1) {
				leaveGroup("main", socket);
			}
			break;
		case "/logout":
		case "/signout":
		case "/lg":
			data.name = 'logout';
			data.msg = '';
			socket.emit("command",data);
			break;
		case "/location":
		case "/loc":
		case "/cd":
			location(socket);
			break;
		case "/lenny":
		case "/lennyface":
		case "/lol":
			lennyFace(socket, tokens[1]);
			break;
		default :
			data.msg = command+" is invalid command.";
			socket.emit('toclient',data);
	}
}
