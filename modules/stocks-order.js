/*
	process stock orders
*/
exports.processOrder = function(req, res, con, Promise){
    console.log("processing order");
    if (!req.body.user){
		res.status(404).json({"error":"you are not signed in"});
    } else {
		/*
			query necessary data to process the orders
			user: money
			stocks: ask/bid price
		*/
		con.query("select users.money, users.id, stocks.slastprice,stocks.sbid,stocks.sask,stocks.scode from users NATURAL JOIN stocks where users.username='"+req.body.user.username+"' and stocks.scode='"+req.body.code+"'", function(inerr,inresult){
			if (inerr) { res.status(401).json({"error": "problem processing order"}); return; }
			var data = inresult[0];

			var bid = parseFloat(data.sbid);
			var ask = parseFloat(data.sask);
			var userMoney = parseFloat(data.money);
			
			//capture return statement if exists
			resmess="";
						
			if (req.body.orderType == "market"){
				//market order
				resmess+=marketOrder(req,res,con,bid,ask,userMoney);
			} else{ 
				//lim/stop order
				resmess+=stoplimOrder(req,res,con,bid,ask,userMoney);
			}

			//if not already returned json
			if ( resmess.indexOf("[object") <0){
				res.json({"success":resmess});
			}
		});
    }
};

var marketOrder = function(req,res,con,bid,ask,userMoney) {
    /**
     *  case: sell market order
     */
    if (ask == null) {
        return "cannot find bid-ask price of stocks, please wait until market opens"; 
    }
    if (req.body.selectPicker == "SELL"){
		return new Promise((resolve,reject)=>{
			var userData;
			try { 
				con.query("select * from users_stocks where userid = '"+req.body.user.id+"' and code= '"+req.body.code+"'", function(userr,usresult){
					if (userr) { reject("error getting users-stocks info -45-stocks-order" + userr); return; }
					userData = usresult[0];

					/**
					 * check if user has enough stocks
					 */
					if (userData.amount >= req.body.quantity) {
						con.query("update users_stocks set amount=amount - "+parseInt(req.body.quantity)+" where userid = '"+req.body.user.id+"' and code = '"+req.body.code+"'", function(err, result) {
							if(err) { reject("error changing user - money : stocks-order"); return; }
							con.query("update users set money= money + "+parseInt(req.body.quantity)*bid +" where username = '"+req.body.user.username+"' and name = '"+req.body.user.name+"'", function(err, result) {
								if (err) { reject("error changing user - money : stocks-order "); return; }
								con.query("INSERT INTO exTransactions values('0','"+req.body.user.id+"','"+req.body.code+"','"+req.body.quantity+"','"+req.body.selectPicker+"','"+req.body.orderType+"','"+'0'+"','"+req.body.timelimit+"',NOW())",function(err,result){
									if (err) { reject("error creating transaction: "+err); return; }
									resolve("sell order successful"); return; 
								});

							}); 
						});
					} else {
						console.log("no stocks - 64");
						reject("not enough stocks"); return;  
					}
				})
			} catch (tr_err){
				console.log("try catch 67");
				reject(tr_err+" code: 67");
				return;
			}
		}).then((success) => { res.json({"success":success}); return; }).catch((fail)=> {res.status(401).json({"error":fail}); return;});

    /**
     *  case: buy market order
     */
    } else if (req.body.selectPicker =="BUY"){
        /**
         * check if user has enough money
         */
		console.log("doing market buy");
			if (userMoney >= (parseInt(req.body.quantity) * ask)) {
				return new Promise((resolve,reject)=>{
					try {
						con.query("select * from users_stocks where userid='"+req.body.user.id+"' and code='"+req.body.code+"'",function(in2err,in2result){
							if (in2err) { reject("in2err"); return; }
							if (in2result[0]==null ){
								con.query("insert into users_stocks values('"+req.body.user.id+"','"+req.body.code+"','0')",function(in3err,in3result){
									if(in3err) { reject("in3err"); return; }
								});
							}
							/*
								Add stocks to user account
							*/
							con.query("UPDATE users_stocks set amount=amount+'"+parseInt(req.body.quantity)+"' where userid='"+req.body.user.id+"' and code='"+req.body.code+"'",function(err,result) {
								if (err) { reject("error handling money of users stocks: "+err); return; } 
								con.query("update users set money = money-'"+parseInt(req.body.quantity)*ask+"' where username='"+req.body.user.username+"'", function(err,result){
									if(err) { reject("error handling money of users: "+err); return; }
									con.query("INSERT INTO exTransactions values('0','"+req.body.user.id+"','"+req.body.code+"','"+req.body.quantity+"','"+req.body.selectPicker+"','"+req.body.orderType+"','"+'0'+"','"+req.body.timelimit+"',NOW())",function(err,result){
										if (err) { reject("error creating transaction: "+err); return; }
										resolve("bought successfully"); return; 
									});
								});
							});   
						});}
					catch (tr_err) {
						console.log("try catch: 109");
						reject(tr_err+" code 106");
					}
				}).then((success) => { res.json({"success":success}); return;}).catch((fail)=> { res.status(401).json({"error": fail}); return;});
			} else{
				console.log("no money");
				res.status(404).json({"error":"not enough money to order"}); 
			}
    }
} 


var stoplimOrder = function(req,res,con,bid,ask,userMoney){
    if (ask == null) {
        return "cannot find bid-ask price of stocks, waiting until market opens";
    }

	/**
		Case: Sell lim/stop order
	*/
    if (req.body.selectPicker == "SELL"){
		return new Promise((resolve,reject)=>{
			var userData;
			var strRet = "";
			con.query("select * from users_stocks where userid = '"+req.body.user.id+"' and code= '"+req.body.code+"'", function(userr,usresult){
				if (userr) { reject("error getting users-stocks info -45-stocks-order" + userr); return; }
				userData = usresult[0];

				/**
				 * check if user has enough stocks
				 */
				if (userData.amount >= req.body.quantity) {
					
					con.query("update users_stocks set amount=amount - "+parseInt(req.body.quantity)+" where userid = '"+req.body.user.id+"' and code = '"+req.body.code+"'", function(err, result) {
						if(err) { reject("error changing user - money : stocks-order"); return; }
						con.query("INSERT INTO transactions values('0','"+req.body.user.id+"','"+req.body.code+"','"+req.body.quantity+"','"+req.body.selectPicker+"','"+req.body.orderType+"','"+req.body.price+"','"+req.body.timelimit+"',NOW())",function(err,result){
							if (err) { reject("error creating transaction: "+err); return; }
							con.query("INSERT INTO exTransactions values('0','"+req.body.user.id+"','"+req.body.code+"','"+req.body.quantity+"','"+req.body.selectPicker+"','"+req.body.orderType+"','"+req.body.price+"','"+req.body.timelimit+"',NOW())",function(err,result){
								if (err) { reject("error creating transaction: "+err); return; }
								resolve("sold successfully"); return; 
							});

						});

					});
				} else {
					reject("not enough stocks-149");  
				}
			});
		}).then((success) => { res.json({"success":"sell order success"}); return; }).catch((fail)=> {res.status(401).json({"error":"Sell order error"}); return;});

    /**
     *  case: buy lim/stop order
     */
    } else if (req.body.selectPicker =="BUY"){
        /**
         * check if user has enough money
         */
		if (userMoney >= (parseInt(req.body.quantity) * parseFloat(req.body.price))) {
			return new Promise((resolve,reject)=>{
				con.query("select * from users_stocks where userid='"+req.body.user.id+"' and code='"+req.body.code+"'",function(in2err,in2result){
					if (in2err) { reject("in2err"); return; }
					if (!in2result[0]){
						con.query("insert into users_stocks values('"+req.body.user.id+"','"+req.body.code+"','0')",function(in3err,in3result){
							if(in3err) { reject("in3err"); return; }
						});
					}
					con.query("update users set money = money-'"+parseInt(req.body.quantity)*parseFloat(req.body.price)+"' where username='"+req.body.user.username+"'", function(err,result){
						if(err) { reject("error handling money of users: "+err); return; }
						con.query("INSERT INTO transactions values('0','"+req.body.user.id+"','"+req.body.code+"','"+req.body.quantity+"','"+req.body.selectPicker+"','"+req.body.orderType+"','"+req.body.price+"','"+req.body.timelimit+"',NOW())",function(err,result){
							if (err) { reject("error creating transaction: "+err); return;  }

							con.query("INSERT INTO exTransactions values('0','"+req.body.user.id+"','"+req.body.code+"','"+req.body.quantity+"','"+req.body.selectPicker+"','"+req.body.orderType+"','"+req.body.price+"','"+req.body.timelimit+"',NOW())",function(err,result){
								if (err) { 
									//reject("error creating transaction: "+err); 
									reject("error creating transaction: "+err); 
									return; 
								}
								resolve("order buy successfully"); return; 
							});
						});
					});
				});
			}).then((success) => { res.json({"success": success}); return;}).catch((fail)=> { res.status(401).json({"error": fail}); return;});
		} else{
			console.log("no money");
			res.status(404).json({"error":"not enough money"});
			return;
		}
    }
}
