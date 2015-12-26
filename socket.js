module.exports = function(httpServer, session) {
	var Group = require('./models/group.js');
	var Channel = require('./models/channel.js');
	var User = require('./models/user.js');
	var Log = require('./models/log.js');
	
	var ios = require('socket.io-express-session');

	var io = require('socket.io').listen(httpServer);
	io.use(ios(session));

	io.sockets.on('connection',function(socket) {
		var username = socket.handshake.session.username;
		var groupname = socket.handshake.session.group;
		var userID = socket.handshake.session.userID;
		var groupID = socket.handshake.session.groupID;
		socket.join(groupname);
		if(username == undefined) {
			socket.emit('toclient',{name:"SYSTEM",msg:'YOU MUST RELOGIN TO CONTINUE!'})
		}
		else {
			socket.on('disconnect', function(data) {
			})
			socket.on('fromclient',function(data) {
				console.log(socket.handshake.session);
				
				if(data.msg.charAt(0) == "/") {
					commands(data.msg,socket);
				}
				else if(data.msg.charAt(0) == "#") {
					hashCommands(data.msg,socket);
				}
				else {
					data.name = username;
					Log.addMessage(userID,groupID, data.channel, data.msg);
					io.sockets.in(groupname).emit('toclient',data);
					//socket.broadcast.emit('toclient',data);
					//socket.emit('toclient',data);
				}
				console.log('Message from client : ['+groupname+']'+data.name+ ' : '+data.msg);
			})
			socket.on('createChannel', function(data) {
				Channel.createChannel(data.channelname, groupID, function(success) {
					io.sockets.in(groupname).emit('channelList', {});
				});
			});
		}
	});
	
	return io;
};

