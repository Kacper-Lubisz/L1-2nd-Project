process.env.NODE_ENV = "test";

const chai = require('chai')
    , chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);

const app = require('../app');

adminAuthenticationToken = { // this is the authentication token for the user with username admin
    message: {
        userID: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        validUntil: 1551379964799,
        isAdmin: false
    },
    signature: 'f76b46a6dcce8a2419358f399138f5b11352e10c2242805844d1e6e5f288ee35'
};

userAuthenticationToken = {
    message: {
        userID: '83566c4039f629d0f95b2e3a9e4306fa15873c898a76117a21a667950b49ba8e',
        validUntil: 1551379590589,
        isAdmin: false
    },
    signature: '978551f53ec29266fbfe8d35efbcb74563f0da7b97dec9e905b4618432333ee1'
};
// TODO
// https://scotch.io/tutorials/test-a-node-restful-api-with-mocha-and-chai
// https://www.chaijs.com/plugins/chai-http/

describe("/users", () => {
    describe("GET /users", () => {

        it("Admin fetch other user", function () {
            chai.request(app)
                .get("/users/83566c4039f629d0f95b2e3a9e4306fa15873c898a76117a21a667950b49ba8e")
                .set("token", JSON.stringify(adminAuthenticationToken))
                .end(function (err, res) {
                    expect(res).to.have.status(200);

                    expect(res.body).to.have.property("userID");
                    expect(res.body).to.have.property("username");
                    expect(res.body).to.have.property("displayName");
                    expect(res.body).to.have.property("displayIcon");
                    expect(res.body).to.have.property("salt");
                    expect(res.body).to.have.property("password");
                    expect(res.body).to.have.property("isAdmin");

                    expect(res.body.userID).to.be.equal("83566c4039f629d0f95b2e3a9e4306fa15873c898a76117a21a667950b49ba8e");

                });
        });

        it("Get user without any authentication token", function () {
            chai.request(app)
                .get("/users/3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF")
                .end(function (err, res) {
                    expect(res).to.have.status(403);
                    expect(res.body).to.have.property("message");
                    expect(res.body.message).to.be.equal("No authentication token provided");
                });
        });

    });

    describe("PUT /users", () => {
        chai.request(app).put("/users");
    });

    describe("PATCH /users", () => {
        chai.request(app).patch("/users");
    });


    describe("DELETE /users", () => {
        chai.request(app).delete("/users");
    });

    describe("POST /users", () => {

        chai.request(app)
            .post("/users")
            .send({username: "admin", password: "admin"})
            .end(function (err, res) {
                // console.log(res.body);
            });

    });

});



