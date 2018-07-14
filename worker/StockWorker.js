//imports
let axios = require("axios");

//set localtime, in case server is in different time zone, handling weekend exceptions
	let d = new Date();
	d.setMinutes(d.getMinutes()-11);
	d.setHours(d.getHours()+3);

	let contain = d.getHours()+":"+d.getMinutes()+":00";

	//if After trading time
	if (d.getHours() >= 16){
		d.setHours(16);
		d.setMinutes(0);
		contain = "16:00:00";
	}

	//if not yet trading time
	if (d.getHours() < 9 && d.getMinutes() < 30){
		//NOTE: d.setDays(-1); works for some specific time zones, needs investigation
		d.setHours(16);
		d.setMinutes(0);
		contain = "16:00:00";
	}

/**
 	Grab Data 
	@params: 
		ticker :string 
		db : mongodb interface
		con : MySQL interface
		state: "NONE" or "SEARCH": if this is search update or normal udpate. 
			normal update stops when weekend or after hour (DEFAULT)
			search update run once to fetch stock, then stop
*/
exports.loadQuote = async function(ticker, db, con, state="NONE")  {
	console.log("1");
	//get json data of stocks
	/** 
		Data 
			"Meta Data" {}
			    '1. Information'
				'2. Symbol'
				'3. Last Refreshed': '2018-03-12 16:00:00',
				'4. Interval'
				'5. Output Size'
				'6. Time Zone'
			"Time Series (1min)"{}
				{ '2018-03-12 16:00:00': 
			   		{ '1. open': '182.0300',
					'2. high': '182.1100',
					'3. low': '181.7100',
					'4. close': '181.7200',
					'5. volume': '1644117'},
				{ ... }
	*/
	await db.collection("test1").find({_id :ticker}).toArray()
		.then((result)=> {
			//check valid data in db 
			if (result.length == 0 ){
				addToMongo(ticker,db , "!EXIST");
			}

			//if this is normal update
			if (state == "NONE"){
				//check weekend : 
				if (d.getDay() == 6 || d.getDay() == 0){
					console.log("weekend");
					return;
				}

				//check time: 
				if (d.getHours() == 16){
					console.log("outside of working hour");
					return;
				}
			}
			
			//check db has on-time data ( if data is one day old);
			try { 
				if (new Date(result[0]["Data"]["Meta Data"]["3. Last Refreshed"].split(" ")[0]) < new Date()){
					addToMongo(ticker,db,"EXIST");
                    console.log("expired: "+ticker);
				}

				let data = Object.keys(result[0]["Data"]["Time Series (1min)"]);
				let info_found = {};

				//find info in mongo
				for (let time_stamp of data){
					if (time_stamp.indexOf(contain) >=0){
						info_found = result[0]["Data"]["Time Series (1min)"][time_stamp];
						addToSQL(info_found, ticker, con);
						return;
					}
				}
			} catch(err) {
				console.log(err);
			}

			// if no info found in mongo

			addToMongo(ticker,db,"EXIST");
			console.log("nothing found for "+ticker);
			db.collection("test1").find({_id:ticker}).toArray()
				.then((in_result)=> {
					for (let time_stamp of Object.keys(in_result[0]["Data"]["Time Series (1min)"])){
						if (time_stamp.indexOf(contain)>=0){
							addToSQL(in_result[0]["Data"]["Time Series (1min)"][time_stamp], ticker, con);
							console.log(in_result[0]["Data"]["Time Series (1min)"][time_stamp]);
							console.log("added to SQL");
							return;
						}
					}
				})
				.catch((in_err)=> {
					console.log(ticker+"error 90");
					console.log(in_err);
					return "Can't find data in MongoDB";
				});

		}).catch((err) => { console.log(ticker+"error 97"+err); return "Can't Load Stock from local"; });
}

/**
    Add to Mongo 
	Load new stock data using axios 
	update data into mongoDB
	@params: 
		ticker: string 
		db : mongoDB
	
*/
let addToMongo = async function(ticker,db, FLAG){
  // free api key on alphavantage.co, go for it
  const host = process.env.NODE_ALPHA_URL
  const key = process.env.NODE_ALPHA_KEY
  const functionType = 'TIME_SERIES_INTRADAY'
	await axios.get(`${host}query?function=${functionType}&symbol="+ticker+"&interval=1min&apikey=${key}")
		.then((res)=> {
			if (FLAG == "EXIST"){
				db.collection("test1").remove({_id:ticker}, function(err_drop,result_drop){
					if (err_drop) {console.log(ticker+"error droping"); console.log(err_drop); 
					} else {
						db.collection("test1").insert({_id:ticker,"Data":res["data"]}, function(err,result){
							if (err) {console.log(ticker+"error updating"); console.log(err); }
							//added to mongodb
						});	
					}
				});
			} else {
				db.collection("test1").insert({_id:ticker,"Data":res["data"]}, function(err,result){
					if (err) {console.log(ticker+"error inserting"); console.log(err); }
					//added to mongodb
				});	
			}
			console.log("updated db-mongo with "+ticker);
		})
		.catch((err)=>{
			console.log(err);
		});
}

/**Add to SQL
	Add Record Data Queried from json in MongoDB to SQL database
	@params: 
		query_data {}
			"Meta Data" : {}
			"Time Series (1min)" : {}
		ticker : str 
		con : MySQL
*/
let addToSQL = async function(query_data, ticker, con){
	let curQuote = format(query_data, ticker);

	await con.query("REPLACE INTO stocks(scode,sname,smarketname,slastprice,sopenprice,sbid,sask,svol,shigh,slow,sclose) VALUES('"+curQuote["code"]+"','"+curQuote["name"]+"','"+curQuote["market"]+"','"+curQuote["last"]+"','"+curQuote["open"]+"','"+curQuote["bid"]+"','"+curQuote["ask"]+"','"+curQuote["vol"]+"','"+curQuote["high"]+"','"+curQuote["low"]+"','"+curQuote["close"]+"');");

	console.log("MySQL database updated "+ticker);
}

/**
	format Stocks 
	@params: stock: {}
		{ '1. open': '181.2900',
		  '2. high': '181.3300',
		  '3. low': '181.2300',
		  '4. close': '181.2350',
		  '5. volume': '40114' }
		ticker : str ("AAPL")
	
	@return: 
		stock {}
			{
				code : str
				name : str
				market: "a US/Easter Company" 
				last  : str 
				open : str 
				high : str
				low : str
				bid : str
				ask : str
				close : str
				vol: str
			}
*/
let format = function(stock, ticker){
	let open = parseFloat(stock["1. open"]);
	let high = parseFloat(stock["2. high"]);
	let low  = parseFloat(stock["3. low"]);
	let close= parseFloat(stock["4. close"]);
	let vol  = parseFloat(stock["5. volume"]);
	return {
		"code" : ticker,
		"name" : ticker+'"s company',
		"market":"a US/Eastern stock market",
		"last"  :""+parseFloat((high+low)/2),
		"open" : ""+open,            
		"high" : ""+high,            
		"low" :  ""+low,            
		"bid" :  ""+parseFloat((high+low)/2 + high/100),
		"ask" :  ""+parseFloat((high+low)/2 - low/100),
		"close": ""+close,            
		"vol":   ""+vol           
	}
}

