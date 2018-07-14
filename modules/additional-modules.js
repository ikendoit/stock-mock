//render home page
exports.renderHome = function(req,res){
    if (!req.session.user){
        res.render("home" , {title: "STOCK MOCK", content : '**WELCOME TRADERS**'});
    } else {
        res.render("home",{user:req.session.user, title: "STOCK MOCK", content: "hello " + req.session.user.name});
    }
}

//render general stockboard page
exports.renderStock = function(req,res,con){
    con.query("select * from stocks", function(err,result) {
        if (err) res.send("error connecting to server");

        if (!req.session.user){
            res.render("stocks-show" , {content: result});
        } else {
            res.render("stocks-show",{user: req.session.user, content: result});
        }
    });
}

//render user-profile
exports.showUser = function(req,res){
    //if (!req.session.user){
    //    res.render("home" , {title: "STOCK HOUSE", message : 'you are not logged in !!'});
    //} else {
        res.render("user-profile",{user:req.session.user});
    //}
};

//show user-stocks-profile
exports.showQuotes = function(req,res,con){
    //if (req.session.user){
		con.query("select users_stocks.amount as amount , stocks.* from users_stocks NATURAL JOIN stocks WHERE users_stocks.userid = '"+req.session.user.id+"' and stocks.scode=users_stocks.code", function (err,result){
			if (err) { console.log("error user-stocks "); return; }
			res.render("user-stocks",{user: req.session.user, content : result});
		});
    //} else {
    //    res.render("home",{title:"log in needed", content: "you need to login"});
    //}
};

//show user-Transaction history
exports.showTrans = function(req,res,con){
	console.log("checking transactions");
    //if (req.session.user){
        con.query("select * from transactions WHERE userid = '"+req.session.user.id+"'", function (err,result){
            if (err) { console.log("error user-stocks: "+err); return; }
        	con.query("select * from exTransactions WHERE userid = '"+req.session.user.id+"'", function (in1err,in1result){
				if (in1err) return in1err; 
           		res.render("user-trans",{user: req.session.user, content: result,content1: in1result});
			});
        });
    //} else {
    //    res.render("home",{title:"log in needed", content: "you need to login"});
    //}
};

//Ajax 
exports.ajaxQuotes = function(req,res,con){
    con.query("select * from stocks", function(err,result){
        if (err) res.send("error while AJAXING");
        res.render("includes/show-quotes",{content: result});
    });
};

//contact: 
exports.contact = function(req,res,con){
	if (req.session.user){
		res.render("contact",{user: req.session.user});
	} else {
		res.render("contact");
	}
};

//policy: 
exports.policy = function(req,res,con){
	if (req.session.user){
		res.render("policy",{user: req.session.user});
	} else {
		res.render("policy");
	}
};
