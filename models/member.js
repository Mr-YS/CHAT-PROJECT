var config = require('../config.js');
var knex = require('knex')(config);

function Member() {}

knex.schema.createTableIfNotExists('member', function(table) {
	table.increments();
	table.integer('userID');
	table.integer('groupID');
	table.timestamp('created_at').defaultTo(knex.fn.now());
}).return();


Member.memberList = function(groupID, callback) {
	knex('member').innerJoin('user', 'user.id', 'member.userID').where('groupID', groupID).then(function(rows) {
		callback(rows);
	});	
}

Member.joinGroup = function(userID, groupID) {
	knex('member').where('groupID', groupID).andWhere('userID', userID).then(function(rows) {
		if(rows.length === 0) {
			knex('member').insert({ userID : userID , groupID : groupID}).return();
		}
	});
}
module.exports = Member;
