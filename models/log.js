var config = require('../config.js');
var knex = require('knex')(config);

function Log() {}

knex.schema.createTableIfNotExists('log', function(table) {
	table.increments();
	table.integer('userID');
	table.integer('groupID');
	table.text('channel');
	table.text('msg');
	table.timestamp('created_at').defaultTo(knex.fn.now());
}).return();

Log.addMessage = function(userID, groupID, channel, msg) {
	knex('log').insert({userID : userID , groupID : groupID , channel : channel , msg : msg}).return()
}

Log.getMessage = function(groupID, channel, callback) {
	knex('log').innerJoin('user', 'user.id', 'log.userID').where('groupID', groupID).andWhere('channel', channel).then(function(rows) {
		callback(rows);
	});
}

module.exports = Log;
