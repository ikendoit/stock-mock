var chai = require("chai");
var chaiHttp = require("chai-http");
var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe("api All Quotes: ", function(){
	it("test certain stocks ", function(done){
		chai.request("http://localhost:8089")
			.get("/api/cert-stocks/AAPL_MSCP_MSFT")
			.end( function(err,res) {

				//general 
				expect(res).to.have.status(200);
				expect(res).to.not.redirect; 

				//content
				expect(res).to.be.json;
                assert.lengthOf(res["body"],3, "response has length 3");

                done();
			});
    });

	it("test certain stocks ", function(done){
		chai.request("http://localhost:8089")
			.get("/api/cert-stocks/AAPL_MSCP_MSFT_AMZN_GOOGL_FSCT")
			.end( function(err,res) {

				//general 
				expect(res).to.have.status(200);
				expect(res).to.not.redirect; 

				//content
				expect(res).to.be.json;
                assert.lengthOf(res["body"],6, "response has length 6");

                done();
			});
     });


	it("test certain stocks ", function(done){
		chai.request("http://localhost:8089")
			.get("/api/cert-stocks/AAPL_")
			.end( function(err,res) {

				//general 
				expect(res).to.have.status(404);
				expect(res).to.not.redirect; 

				//content
				expect(res).to.be.json;

                done();
			});
     });

     it("test all stocks", function(done){
        chai.request("http://localhost:8089")
			.get("/api/stocks/")
            .end( function(err,res) {

				//general 
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res).to.not.redirect; 

				//content
				assert.lengthOf(res["body"], 11, "response has length of 11 stocks");	

				done();
			});
	});


});
