exports.login = function(req,res,con,sanitizer){
    console.log("trying to log in");
    // check if session already exists or site is vulnerable
    if (req.session && req.session.user) {
        con.query("select username from users where username='"+sanitizer(req.session.user.username)+"' LIMIT 1" , function(err,result){
            if (err) res.send(err);
            if (result.length ==1 ) {
                res.redirect("/");
            } else {
                delete req.session.user;  
                res.redirect("/");
            }
        }); 
        return;
    }

	//check if fields are filled
	if (req.body.logUsername == "" || req.body.logPassword==""){
		res.send("need username and password");
		return;
	}

	console.log("Welcome" +req.body.logUsername);

    //log in normally
    con.query("select id,username,name,address,money from users where username='"+sanitizer(req.body.logUsername)+"' and password='"+sanitizer(req.body.logPassword)+"' LIMIT 1", function(err,result){
        if (err) { 
            res.send("error while logging in ");
            return;
        }
        if (result.length != 1) {
            res.send("username not registered yet !");
            return;
        } else {
            req.session.user = result[0]; 
            require("../controllers/additional-modules").renderHome(req,res);
        }
    });
}
