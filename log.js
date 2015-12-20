var config = require('./config.js');
var knex = require('knex')(config);

function Log() {
	knex.schema.createTableIfNotExists('log', function(table) {
		table.increments();
		table.integer('userID');
		table.integer('groupID');
		table.text('msg');
		table.timestamp('created_at').defaultTo(knex.fn.now());
	}).return()
}

Log.prototype.addMessage = function(userID, groupID, msg) {
	knex('log').insert({userID : userID , groupID : groupID , msg : msg}).return()
}

Log.prototype.getMessage = function(groupID, callback) {
	knex('log').innerJoin('user', 'user.id', 'log.userID').where('groupID', groupID).then(function(rows) {
		callback(rows);
	});
}
module.exports = Log;
