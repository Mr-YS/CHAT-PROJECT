'use strict';

var express = require('express');
var config = require('./config.js');
var knex = require('knex')(config);
var crypto = require('crypto');

var User = require('./models/user.js');
var Group = require('./models/group.js');
var Log = require('./models/log.js');
var Channel = require('./models/channel.js');
var Member = require('./models/member.js');

var router = express.Router();

router.get('/',function(req,res) {
	if(req.session.username === undefined) {
		res.redirect('/login');
	}
	else {
		res.redirect('/hub');
	}
});

router.get('/login',function(req,res) {
	res.render('pages/login', {
		flash:req.flash('warning')[0]
	});
});

router.get('/signup',function(req,res) {
	res.render('pages/signup');
});

router.get('/hub', function(req, res) {
	if(req.session.username === undefined) {
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

router.get('/logout',function(req,res) {
	req.session.destroy();
	res.redirect('/');
});

router.get('/group/:groupname', function(req,res) {
	if(req.session.username === undefined) {
		res.redirect('/login');
	}
	else {
		req.session.groupname = req.params.groupname;
		Group.getID(req.session.groupname, function(ID) {
			if(ID === -1) {
				res.redirect('/');
			}
			else {
				req.session.groupID = ID;
				Member.joinGroup(req.session.userID, ID);		
				Log.getMessage(req.session.groupID, 'hub' , function(rows) {
					res.render('pages/index', { session: req.session });
				});
			}			
		});
	}
});

router.post('/signup',function(req,res) {
	User.exists(req.body.username, function(result) {
		if(result) {
			res.redirect('/signup');
		}
		else {
			User.addUser(req.body.username, req.body.password, function() {
				res.redirect('/login');
			});
		}
	});
});

router.post('/login', function(req,res) {
	User.exists(req.body.username, req.body.password, function(result,id) {
		if(result) {
			req.session.username = req.body.username;
			req.session.userID = id;
			res.redirect('/hub');
		}
		else {
			req.flash('warning','test');
			res.redirect('/login');
			res.end();
		}
	});
});

router.post('/hub', function(req, res) {
	Group.exists(req.body.groupname, req.body.password, function(result, id) {
		if(result) {	
			console.log(req.body.groupname);
			req.session.groupname = req.body.groupname;
			req.session.groupID = id;
			res.redirect('/group/' + req.body.groupname);
		}
		else {
			res.redirect('/hub');
		}
	});
});

router.post('/group/create', function(req, res) {
	Group.createGroup(req.body.groupname, req.session.userID, function(success) {
		res.json(success)
	});
});

router.get('/log/:channel', function(req, res) {
	Log.getMessage(req.session.groupID, req.params.channel , function(rows) {
		res.json(rows)
        });	
});

router.get('/channel/list', function(req, res) {
	Channel.channelList(req.session.groupID, function(rows) {
		res.json(rows)
	});
});

router.get('/group/getID/:groupname', function(req, res) {
	Group.getID(req.params.groupname, function(ID) {
		res.json(ID)
	})
});

router.get('/member/list', function(req, res) {
	Member.memberList(req.session.groupID, function(rows) {
		res.json(rows)
	})
});
module.exports = router;

