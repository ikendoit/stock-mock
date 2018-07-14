exports.logout = function(req,res){
    delete req.session.user;
    res.redirect("/");
}
