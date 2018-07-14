//render stock order page
exports.search = function (req, res, exec, con) {
    //process req.body.code
    console.log(req.body.code);
    let codes = req.body.code.trim();
    codes = codes.toUpperCase();
    codes = '"' + codes + '"';
    let query = codes.replace(/ /g, '","');
    console.log("---" + query + "---");
    con.query("select * from stocks WHERE scode IN (" + query + ");", function (err, result) {
        if (err) { return err; }
        if (!req.session.user) {
            if (result.length == 0) {
                console.log(result);
                result = [{
                    "amount": 0,
                    "scode": "New stock, Please Order This Stock First",
                },];
            }
            res.render("user-stocks", { content: result });
        } else {
            res.render("user-stocks", { user: req.session.user, content: result });
        }
    });
};
