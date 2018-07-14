exports.signup = function(req,res,con,sanitizer){
    con.query("select username from users where username='"+req.body.signUsername+"'", function(err,result){
        if (err) res.send("error while registering" + err);
        console.log(result.length);
        if (result.length >=1) {
            res.send("username already taken"); 
            console.log(result[0] + "  ||  " + req.body.signUsername);
        } else {
            con.query("insert into users(username,password,name,email,address,money) values('"+sanitizer(req.body.signUsername)+"','"+sanitizer(req.body.signPassword)+"','"+sanitizer(req.body.signName)+"','"+sanitizer(req.body.signEmail)+"','"+sanitizer(req.body.signAddress)+"','"+50000+"')", function(inerr,inresult){
                if (inerr) {
                    res.send("error in loading" + inerr);
                }
                res.render("home",{title: "STOCK MOCK", message:"REGISTERED SUCESSFULLY, please log in"});
            });
        }
    });
}

