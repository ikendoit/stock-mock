var chai = require("chai");
var chaiHttp = require("chai-http");
var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe("api Users: ", function(){

    it("test signin", function(done){
        chai.request("http://localhost:8089")
            .post("/api/sign-in/")
            .send({username:"kenadmin", password: "wowbitch"})
            .end(function(err,res){
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res).to.not.redirect;
                done();
            });
    });

    it("test signin-2", function(done){
        chai.request("http://localhost:8089")
            .post("/api/sign-in/")
            .send({username:"test1", password: "test1"})
            .end(function(err,res){
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res).to.not.redirect;
                done();
            });
    });



    it("test signin-error", function(done){
        chai.request("http://localhost:8089")
            .post("/api/sign-in/")
            .send({username:"kenadmin", password: "wrong pass"})
            .end(function(err,res){
                expect(res).to.have.status(404);
                expect(res).to.be.json;
                done();
            });
    });

    it("test signin-error", function(done){
        chai.request("http://localhost:8089")
            .post("/api/sign-in/")
            .send({username:"*", password: "*"})
            .end(function(err,res){
                expect(res).to.have.status(404);
                expect(res).to.be.json;
                done();
            });
    });

    it("test signin-error", function(done){
        chai.request("http://localhost:8089")
            .post("/api/sign-in/")
            .send({username:"", password: ""})
            .end(function(err,res){
                expect(res).to.have.status(404);
                expect(res).to.be.json;
                done();
            });
    });

    it("test signin-error", function(done){
        chai.request("http://localhost:8089")
            .post("/api/sign-in/")
            .send({username:"test1", password: "*"})
            .end(function(err,res){
                expect(res).to.have.status(404);
                expect(res).to.be.json;
                done();
            });
    });


    it("test signin-error", function(done){
        chai.request("http://localhost:8089")
            .post("/api/sign-in/")
            .send({username:"test1", password: '" or "1"="1'})
            .end(function(err,res){
                expect(res).to.have.status(404);
                expect(res).to.be.json;
                done();
            });
    });


    it("test signin-error", function(done){
        chai.request("http://localhost:8089")
            .post("/api/sign-in/")
            .send({username:"test1", password: ''})
            .end(function(err,res){
                expect(res).to.have.status(404);
                expect(res).to.be.json;
                done();
            });
    });
});
