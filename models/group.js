'use strict';

var config = require('../config.js');
var knex = require('knex')(config);
var crypto = require('crypto');
var channel = require('./channel.js');

function Group() {
}

knex.schema.createTableIfNotExists('group', function(table) {
	table.increments();
	table.text('groupname')
	table.integer('userID')
	table.timestamp('created_at').defaultTo(knex.fn.now());
}).return();

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

Group.getID = function(groupname, callback) {
	knex('group').where('groupname', groupname).then(function(rows) {
		if(rows.length === 0) {
			callback(-1);
		}
		else {
			callback(rows[0]);
		}
	});	
}

Group.createGroup = function(groupname, userID, callback) {
	if(groupname.trim().length === 0) {
		callback(false);
	}
	else {
		knex('group').where('groupname', groupname).then(function(rows) {
			if(rows.length === 0) {
				knex('group').insert({groupname : groupname.trim(), userID : userID}).then(function(rows) {
					channel.createChannel('hub', rows[0], function() {
						callback(true);
					})	
				})
			}
			else {
				callback(false);
			}
		});
	}
}	

module.exports = Group;
