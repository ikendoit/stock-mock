var routing = require("./controllers/index.js");
var express = require("express");
var favicon = require("serve-favicon");
let cors = require('cors');
var app = express();

//middlewares
app.set("view engine", "pug");
app.use("/api/", routing);
app.use(express.static(__dirname + "/build/"));

app.use(cors());
app.use(favicon(__dirname + "/build/favicon.ico"));

if (process.env.NODE_ENV === 'DEVELOPMENT') {
	app.listen(8089, "0.0.0.0", function () {
		console.log("listenning at port 8089");
	});
} else {
	var createServer = require("auto-sni");
	createServer({
		email: process.env.NODE_EMAIL,
		domains: ["stockmock.cf", "www.stockmock.cf"],
		ports: {
			http: 80,
			https: 443,
		},
		agreeTos: true,
	}, app);
}
