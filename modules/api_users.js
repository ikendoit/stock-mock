//sign in 
// return: userData
exports.signIn = function (req, res, con, sanitizer) {
	con.query("select * from users where username='" + req.body.username + "' and password='" + req.body.password + "'", function (err, result) {
		if (err) { res.status(404).json({ "error": "problem querying data" }); return; }
		if (result == undefined || result.length == 0) {
			console.log("error logging in: " + req.body.usernamme + " -- " + req.body.password);
			res.status(404).json({ "error": "user not existing" });
		} else {
			result[0]["password"] = "00000";
			res.json(result);
		}
	});
};

/*
	sign up 
	return json confirmation
*/
exports.signUp = function (req, res, con, sanitizer) {
	con.query("select * from users where username='" + req.body.username + "'", function (err, result) {
		if (err) { console.log(err); res.status(404).json({ "error": "error loading database" }); return; }
		if (result.length >= 1) {
			res.status(404).json({ "error": "username already taken" });
		} else {
			con.query("insert into users(username,password,name,email,money) values('" + sanitizer(req.body.username) + "','" + sanitizer(req.body.password) + "','" + sanitizer(req.body.name) + "','" + sanitizer(req.body.email) + "','" + 50000 + "')", function (inerr, inresult) {
				if (inerr) {
					console.log(inerr);
					res.status(404).json({ "error": "error loading database" });
				}
				res.status(200).json({ "success": "you have signed up successfully; please log in" });
			});
		}
	});
};


//TODO: take in JWT, return appropriate user information
/* 
	api user information
*/
exports.apiUser = function (req, res, con) {
	con.query("select * from users where id=" + req.body.user.id, function (err, result) {
		if (err) { res.status(404).json({ "error": "problem querying data - 36" }); return; }
		if (result == undefined || result.length == 0) {
			res.status(404).json({ "error": "user not existing" });
		} else {
			// set mock password
			result[0]["password"] = "00000";
			res.json(result);
			return;
		}
	});
};

/*
	api user_stocks possessions
*/
exports.apiMyStock = function (req, res, con) {
	con.query("select * from users_stocks natural join stocks where users_stocks.code=stocks.scode and users_stocks.userid=" + req.body.user.id, function (err, result) {
		if (err) { res.status(404).json({ "error": "problem querying data - 49" }); return; }
		res.json(result);
	});
}

exports.apiTransactions = function (req, res, con) {
	con.query("select * from transactions join stocks where transactions.code=stocks.scode and transactions.userid='" + req.body.user.id + "';", function (err, result) {
		if (err) { console.log("user not found " + err); res.status(404).json({ "error": "User not found" }); return; }
		res.json(result);
	});
}
