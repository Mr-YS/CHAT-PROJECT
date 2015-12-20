'use strict';

var config = require('../config.js');
var knex = require('knex')(config);
var crypto = require('crypto');

function Group(name, groupAdmin) {
  this.name = name;
  this.groupAdmin = groupAdmin;
  this.password = undefined;
  this.members = [];
}

Group.exists = function(groupname, password, callback) {
	if(typeof password === 'function') {
                callback = password;
                password = undefined;
        }
        knex('group').where('groupname', groupname)
        .then(function(rows) {
                if(rows.length === 1) {
                	callback(true, rows[0].id);
                }
		else {
			callback(false);
		}
	})
}

Group.prototype.addUser = function(user, password) {
  if(this.password === password) {
    this.members.push(user);
    user.socket.join(this.name);
  }
}

Group.prototype.removeUser = function(user) {
  var index = this.members.indexOf(user);
  if(index !== -1) {
    this.members.splice(index, 1);
    user.socket.leave(this.name);
  }
}

Group.prototype.kickUser = function(user, groupAdmin) {
  if(this.groupAdmin === groupAdmin) {
    this.removeUser(user);
  }
}

Group.prototype.setPassword = function(groupAdmin, password) {
  if(this.groupAdmin === groupAdmin) {
    this.password = password;
  }
}

Group.prototype.sendMessage = function(user, msg) {
  var index = this.members.indexOf(user);
  if(index !== -1) {
      user.socket.to(this.name).broadcast.emit('toclient',{name : user.name , msg : msg});
      user.socket.emit('toclient',{name : user.name , msg : msg});
  }

}

Group.prototype.memberList = function(socket) {
    var msg = '';
    var count = 1;
    msg += "GROUP/CHANNEL-NAME : " + this.name + "<BR><BR>";
    for(var member in this.members) {
        msg += (count++) + ". " + member.name + "<BR>";
    }
    socket.emit('toclient', { name : "", msg : msg })
}

module.exports = Group;
