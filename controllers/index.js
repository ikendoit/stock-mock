//init vars
var express = require("express");
var router = express.Router();
var body = require("body-parser");
var session = require("client-sessions");
var addModules = require("../modules/additional-modules");
var stocksOrder = require("../modules/stocks-order");
var api_stocks = require("../modules/api_stocks");
var api_users = require("../modules/api_users");
var ron = require("cron").CronJob;
var helmet = require("helmet");
var sanitizer = require("sanitize-html");
var Promise = require("Promise");
let MongoDb = require("mongodb").MongoClient;

//use 
router.use(body());
router.use(session({
	cookieName: "session",
	secret: "random_string",
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}));
router.use(express.static("public"));
router.use(helmet.xssFilter());
router.use(helmet.frameguard({
	action: "ALLOW-FROM",
	domain: "http://stockmock.cf/"
}));

//mysql 
var mysql = require("mysql");

var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "123456",
	database: "stocks"
});

con.connect(function (err) {
	if (err) console.log("error connecting to mysql");
	console.log("connected to mysql database");
});

//cron job
require("../worker/cron-jobs").transactions(ron, con);

//routing

// sanitize user-signup && process signup
router.post("/signup", function (req, res) {
	require("../modules/user-signup").signup(req, res, con, sanitizer);
});

//user-login
router.post("/login", function (req, res) {
	require("../modules/user-login").login(req, res, con, sanitizer);
});

//user-logout
router.get("/logout", valUser, function (req, res) {
	require("../modules/user-logout").logout(req, res);
});

//user-profile
router.get("/user-profile", valUser, function (req, res) {
	addModules.showUser(req, res);
});

//AJAX: show all Quotes
router.get("/ajax-quotes", function (req, res) {
	addModules.ajaxQuotes(req, res, con);
});

//user-stocks
router.get("/user-stocks", valUser, function (req, res) {
	addModules.showQuotes(req, res, con);
});

//user-transaction
router.get("/user-transactions", valUser, function (req, res) {
	addModules.showTrans(req, res, con);
});

//API: 
router.get("/stocks", function (req, res) {
	api_stocks.apiStocks(req, res, con);
});

router.get("/cert-stocks/:code", function (req, res) {
	MongoDb.connect("mongodb://localhost:27017", function (err, client) {
		if (err) { console.log("error connecting to Mongo"); }
		else {
			let db = client.db("stocks");
			api_stocks.apiStockCode(req, res, con, db);
		}
	});

});

router.post("/user", function (req, res) {
	console.log("hello " + req.get("host"));
	api_users.apiUser(req, res, con);
});

router.post("/user/stocks", function (req, res) {
	api_users.apiMyStock(req, res, con);
});

router.post("/user/transactions", function (req, res) {
	api_users.apiTransactions(req, res, con);
});

router.post("/user/order", function (req, res) {
	stocksOrder.processOrder(req, res, con, Promise);
});

router.post("/sign-in", function (req, res) {
	api_users.signIn(req, res, con, sanitizer);
});

router.post("/sign-up", function (req, res) {
	api_users.signUp(req, res, con, sanitizer);
});


//expose 
module.exports = router;

//middleware : check user loged in 
function valUser(req, res, next) {
	if (!req.session.user) {
		res.render("home", { title: "STOCK MOCK", content: '**Please Login First**' });
	} else {
		next();
	}
}
