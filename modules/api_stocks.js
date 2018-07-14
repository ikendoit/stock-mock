let stockWorker = require("../worker/StockWorker");

exports.apiStocks = function(req,res,con) {
	con.query("select * from stocks", function(err,result){
		if (err) { res.status(404).json({"error" : "error querying data"}); return; } 
		res.status(200).json(result);
	});
};

exports.apiStockCode = async function(req,res,con,db) {
    let quotes = req.params.code.split("_");
	console.log(quotes);

	let queries = "scode='"+quotes[0]+"'";

	for (let quote of quotes){
		queries += " or scode='"+ quote +"'"; 
	}

    con.query("select * from stocks where " +queries, function(err,result){
    	if (err) { res.status(404).json({"error" : "invalid code: "}); return; } 

    	if (result.length != quotes.length){
            console.log("invoking python");
			
			//check undefined quotes
			for (let miniResult of result) {
				if (quotes.indexOf(miniResult["scode"]) > -1) {
					quotes = quotes.splice(quotes.indexOf(miniResult["sname"]),1);
				}
			}

			//undefined quotes result
			console.log("undefined: "+quotes);
            for (let undefinee of quotes){
                stockWorker.loadQuote(undefinee, db, con, "SEARCH");
                console.log("processed "+undefinee);
            }

			//Show stock
			con.query("select * from stocks where "+queries, function(err,result){
				if (err) { res.status(404).json({"error": "problem connecting to server"}); return;}
				res.status(200).json({"data": result});
			});

        } else {
        	res.json(result);		
        	return;
        }
    });
};
