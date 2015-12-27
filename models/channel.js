'use strict';

var config = require('../config.js');
var knex = require('knex')(config);

function Channel() {}

knex.schema.createTableIfNotExists('channel', function(table) {
	table.increments();
	table.integer('groupID');
	table.text('channelname');
	table.timestamp('created_at').defaultTo(knex.fn.now());	
}).return();

Channel.createChannel = function(channelname, groupID, callback) {
	if(channelname.trim().length === 0) {
		callback(false);
	}
	knex('channel').where('groupID', groupID).andWhere('channelname', channelname).then(function(rows) {
		if(rows.length === 0) {
			knex('channel').insert({channelname : channelname.trim(), groupID : groupID}).then(function(rows) {
				callback(true);
			})
		}
		else {
			callback(false);
		}
	});
}

Channel.channelList = function(groupID, callback) {
	knex('channel').where('groupID', groupID).then(function(rows) {
		callback(rows);
	});
}

module.exports = Channel;
