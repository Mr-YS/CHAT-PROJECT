module.exports = function(httpServer, session) {
	var Group = require('./models/group.js');
	var User = require('./models/user.js');
	var Log = require('./models/log.js');
	
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

	var ios = require('socket.io-express-session');

	var io = require('socket.io').listen(httpServer);
	io.use(ios(session));

	io.sockets.on('connection',function(socket) {
		var username = socket.handshake.session.username;
		if(username == undefined) {
			socket.emit('toclient',{name:"SYSTEM",msg:'YOU MUST RELOGIN TO CONTINUE!'})
		}
		else {
			socket.on('disconnect', function(data) {
				var user = users[this.id];
				if(user !== undefined) {
					groups[user.group].removeUser(user);
				}
				getGroupsMemberCount();
			})
			socket.on('fromclient',function(data) {
				console.log(socket.handshake.session);
				var groupname = socket.handshake.session.group;
				var userID = socket.handshake.session.userID;
				var groupID = socket.handshake.session.groupID;
				
				if(data.msg.charAt(0) == "/") {
					commands(data.msg,socket);
				}
				else if(data.msg.charAt(0) == "#") {
					hashCommands(data.msg,socket);
				}
				else {
					data.name = username;
					socket.join(groupname);
					Log.addMessage(userID,groupID, data.channel, data.msg);
					io.sockets.in(groupname).emit('toclient',data);
					//socket.broadcast.emit('toclient',data);
					//socket.emit('toclient',data);
				}
				console.log('Message from client : ['+groupname+']'+data.name+ ' : '+data.msg);
			})
		}
	});

	// command functions

	function leaveGroup(groupName, socket) {
		Group.removeUser(socket.handshake.session.username);
		window.close();
		/*
		if(groups.groupName !== undefined) {
			var index = groups.groupName.indexOf(socket.handshake.session.username);
			if(index !== -1) {
				socket.leave(groupName);
				joinGroup('main', socket);
			}
		}
		*/
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
		help : " THIS COMMAND IS GOING TO BE FIXED SOON. SORRY. "
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
			case "/opop":
				if(tokens.length === 1) {
				}
			default :
				data.msg = command+" is invalid command.";
				socket.emit('toclient',data);
		}
	}
	
	return io;
};

