//import: mongodb, stock worker

let MongoDb = require("mongodb").MongoClient;
let stock_worker = require("./StockWorker");


/**
 * check all expired transaction to delete
 * market order: delete all 
 * stop/limit order: return user : 
 *      - stocks if they are selling
 *      - money if they are buying
 *
 * check if stop/ limit orders are satisfied
 */
exports.transactions = function(ron,con) {
    MongoDb.connect("mongodb://localhost:27017", function(err,client){
        if (err) { console.log("error connecting to Mongo"); }
        else {
            let db = client.db("stocks");

            //start cron
            var transaction = new ron('0 * * * * *',check(con, db), null , true, "America/New_York");
            transaction.start();
        }
    });
};

// Pending Transactionsl + Stock Management
	/** 
		check for pending transaction and process them
	*/
	var check = function(con,db){
		return function(){
			try{
                //run update All Stocks
                con.query("select scode from stocks", function(err,result){
                    if (err) { 
                        console.log("cant update all stocks: "+err);
                    } else {
                        for (i = 0; i < result.length ; i++){
                            stock_worker.loadQuote(result[i]["scode"],db,con);
                            console.log("worked with"+result[i]["scode"]);
                        }
                    }
                });
                
                //checking pending stock transactions
				con.query("select * from transactions",function(err,result) {
					if (err) return (err);
					var date = new Date();
					for (var i = 0 ; i < result.length; i ++ ){
						var cur= result[i];
						// check if date limit is reached from created_date to current date
						if (date.getDate() - cur.date_created.getDate()+ (date.getMonth()- cur.date_created.getMonth() + 12*(date.getYear()- cur.date_created.getYear()))*((((cur.date_created.getMonth()+1)%7)%2)+30) >cur.time_limit){
							// delete transactions
							con.query("delete from transactions where id='"+cur.id+"'",function(inerr,inresult){
								if (inerr) return(inerr);
								console.log("deleted one transcation");
							});
							// return stocks/ money if limit/stop orders 
							if (cur.order_type !="market") {
								returnAssets(con,cur);  
							}                    
						}

						//check limit order
						if (cur.order_type == "limit"){
							checkLim(con,cur);
						}
						
						//check stop order
						if (cur.order_type == "stop"){
							checkStop(con,cur);
						}
					}
				});
                console.log("finished updating");
			} catch(ex) {
				console.log(ex);
			}
		}
	};

	/**
	 * return assets for users 
	 */
	var returnAssets = function(con,data){
		if (data.type =="SELL"){
			con.query("update users_stocks set amount=amount+'"+parseInt(data.amount)+"' where userid='"+data.userid+"' and code = '"+data.code+"'", function(inerr, inresult){
				if (inerr) console.log("problem returning assets "+inerr);
				console.log("returned stocks to userid: "+data.userid);
			});
		} else if (data.type=="BUY"){
			con.query("update users set money = money + '"+data.price*data.amount+"' where id='"+data.userid+"'", function(inerr,inresult){
				if (inerr) console.log("problem returning assets "+inerr);
				console.log("returned money to userid: "+data.userid);
			});
		}
	}

	/**
	 * check if limit orders are met
	 */
	var checkStop = function(con,data){
		try{
			con.query("select * from stocks where scode='"+data.code+"'",function(err, result) { 
				var ret = result[0];
				/**
				 * check if bid - ask are NaN
				 */
				if (!isNaN(ret.sbid) && !isNaN(ret.sask)) {
					switch(data.type) {
						/**
						 * buy at stop/limit order: give user stocks 
						 */
						case "BUY": {
							if (parseFloat(data.price) >= parseFloat(ret.sask)){
								console.log("stop order buy processed");
								con.query("update users_stocks set amount=amount+'"+parseInt(data.amount)+"' where userid='"+data.userid+"' and code='"+data.code+"'",function(inerr,inresult){
									if (inerr) return (inerr);
								});
								con.query("delete from transactions where id='"+data.id+"'", function(inerr, inresult) {
									if (inerr) return (inerr);
								});
							} 
							break;
						}
						/**
						 * sell at stop/limit order: give user money
						 */
						case "SELL": {
							if (parseFloat(data.price) <= parseFloat(ret.sbid)) { 
								console.log("stop order sell processed");
								con.query("update users_stocks set amount= amount - '"+parseInt(data.amount)+"' where userid='"+data.userid+"' and code='"+data.code+"'", function(inerr, inresult) { 
									if (inerr) return(inerr);
								});

								con.query("update users set money=money+'"+parseFloat(ret.bid)*parseInt(data.amount)+"' where id='"+data.userid+"'", function(inerr, inresult) {
									if (inerr) return (inerr);
								});

								con.query("delete from transactions where id='"+data.id+"'", function(inerr, inresult){
									if (inerr) return (inerr);
								});
							}
							break; 
						}
					}
				}
			});
		} catch(ex){
			console.log(ex);
		}
	};


	/**
	 * check if stop orders are met
	 */
	var checkLim = function(con,data){
		try{
			con.query("select * from stocks where scode='"+data.code+"'",function(err, result) { 
				var ret = result[0];
				/**
				 * check if bid-ask is NaN
				 */
				if (!isNaN(ret.sbid) && !isNaN(ret.sask)) {
					switch(data.type) {
						/**
						 * buy are limit order: give user stocks
						 */
						case "BUY": {
							if (parseFloat(data.price) >= parseFloat(ret.sask)){
								console.log("limit order processed");
								con.query("update users_stocks set amount=amount+'"+parseInt(data.amount)+"' where userid='"+data.userid+"' and code='"+data.code+"'",function(inerr,inresult){
									if (inerr) return (inerr);
								});
								con.query("delete from transactions where id='"+data.id+"'", function(inerr, inresult) {
									if (inerr) return (inerr);
								});
							} 
							break;
						}
						/**
						 * sell: give user money
						 */
						case "SELL": {
							if (parseFloat(data.price) <= parseFloat(ret.sbid)) { 
								console.log("limit order sell processed");
								con.query("update users set money=money+'"+parseFloat(data.price)*parseInt(data.amount)+"' where id='"+data.userid+"'", function(inerr, inresult) {
									if (inerr) return (inerr);
								});

								con.query("delete from transactions where id='"+data.id+"'", function(inerr, inresult){
									if (inerr) return (inerr);
								});
							}
							break; 
						}
					}
				}
			});
		} catch(ex){
			console.log(ex);
		}
	}

