'use strict';

var config = require('../config.js');
var knex = require('knex')(config);
var crypto = require('crypto');

function User(name, socket, group) {
  this.name = name;
  this.socket = socket;
  this.group = group;
};

User.exists = function(username, password, callback) {
	if(typeof password === 'function') {
		callback = password;
		password = undefined;
	}
	knex('user').where('username', username)
	.then(function(rows) {
		if(rows.length === 1) {
			if(password === undefined) {
				callback(true);
			}
			else {
				var hmac = crypto.createHmac('sha1','!yoonsang?|');
				hmac.setEncoding('hex');
				hmac.write(password);
				hmac.end();
				var new_password = hmac.read();
				if(new_password === rows[0].password) {
					callback(true, rows[0].id);
				}
				else {
					callback(false);
				}
			}
		}
		else {
			callback(false);
		}
	});
};

User.addUser = function(username, password, callback) {
	var hmac = crypto.createHmac('sha1','!yoonsang?|');
	hmac.setEncoding('hex');
	hmac.write(password);
	hmac.end();
	var new_password = hmac.read();
	knex('user').insert({
		username: username,
		password: new_password
	}).then(function() {
		callback();
	});
};

module.exports = User;
