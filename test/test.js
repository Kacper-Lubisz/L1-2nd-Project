process.env.NODE_ENV = "test";

const chai = require("chai")
  , chaiHttp = require("chai-http");
const expect = chai.expect;
chai.use(chaiHttp);

const app = require("../app");

// TODO
// https://scotch.io/tutorials/test-a-node-restful-api-with-mocha-and-chai
// https://www.chaijs.com/plugins/chai-http/

describe("/users", () => {
  describe("GET /users", () => {

    it("Access without any authentication token", function () {
      chai.request(app)
        .get("/users?userID=0000000000000000000000000000000000000000000000000000000000000000")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No authentication token provided");
        });
    });

    it("access from non existing user token", function () {
      chai.request(app)
        .get("/users?userID=0000000000000000000000000000000000000000000000000000000000000000")
        .set("token", "notAnUserToken")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Authentication token belongs to no user");
        });
    });

    it("selection by both", function () {
      chai.request(app)
        .get("/users?userID=00&email=some")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Must select user by userID or email");
        });
    });

    it("no selection", function () {
      chai.request(app)
        .get("/users")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Must select user by userID or email");
        });
    });

    it("select self by id", function () {
      chai.request(app)
        .get("/users?userID=0000000000000000000000000000000000000000000000000000000000000000")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res).to.have.property("body");

          expect(res.body).to.have.property("userID");
          expect(res.body).to.have.property("email");
          expect(res.body).to.have.property("displayName");
          expect(res.body).to.have.property("identicon");
          expect(res.body).to.have.property("isAdmin");

          expect(res.body.userID).to.be.equal("0000000000000000000000000000000000000000000000000000000000000000");
          expect(res.body.email).to.be.equal("youremail@address.here");
          expect(res.body.displayName).to.be.equal("Name 0");
          expect(res.body.identicon).to.be.equal("/icons/FF6F00.png");
          expect(res.body.isAdmin).to.be.equal(false);

        });
    });

    it("select other by id, no admin", function () {
      chai.request(app)
        .get("/users?userID=0000000000000000000000000000000000000000000000000000000000000001")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Admin permission needed to access other users");
        });
    });


    it("select other by id, admin, doesn't exist", function () {
      chai.request(app)
        .get("/users?userID=1111111111111111111111111111111111111111111111111111111111111111")
        .set("token", "user1adminToken")
        .end(function (err, res) {
          expect(res).to.have.status(404);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No user found with userID 1111111111111111111111111111111111111111111111111111111111111111");
        });
    });

    it("select other by id, admin, exists", function () {
      chai.request(app)
        .get("/users?userID=0000000000000000000000000000000000000000000000000000000000000000")
        .set("token", "user1adminToken")
        .end(function (err, res) {

          expect(res).to.have.status(200);
          expect(res).to.have.property("body");

          expect(res.body).to.have.property("userID");
          expect(res.body).to.have.property("email");
          expect(res.body).to.have.property("displayName");
          expect(res.body).to.have.property("identicon");
          expect(res.body).to.have.property("isAdmin");

          expect(res.body.userID).to.be.equal("0000000000000000000000000000000000000000000000000000000000000000");
          expect(res.body.email).to.be.equal("youremail@address.here");
          expect(res.body.displayName).to.be.equal("Name 0");
          expect(res.body.identicon).to.be.equal("/icons/FF6F00.png");
          expect(res.body.isAdmin).to.be.equal(false);

        });
    });

    it("select self by email", function () {
      chai.request(app)
        .get("/users?email=youremail@address.here")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res).to.have.property("body");

          expect(res.body).to.have.property("userID");
          expect(res.body).to.have.property("email");
          expect(res.body).to.have.property("displayName");
          expect(res.body).to.have.property("identicon");
          expect(res.body).to.have.property("isAdmin");

          expect(res.body.userID).to.be.equal("0000000000000000000000000000000000000000000000000000000000000000");
          expect(res.body.email).to.be.equal("youremail@address.here");
          expect(res.body.displayName).to.be.equal("Name 0");
          expect(res.body.identicon).to.be.equal("/icons/FF6F00.png");
          expect(res.body.isAdmin).to.be.equal(false);

        });
    });

    it("select other by email, no admin", function () {
      chai.request(app)
        .get("/users?email=differentEmail")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Admin permission needed to access other users");
        });
    });

    it("select other by email, admin, doesn't exist", function () {
      chai.request(app)
        .get("/users?email=notSomethingInTheDatabase")
        .set("token", "user1adminToken")
        .end(function (err, res) {
          expect(res).to.have.status(404);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No user found with email notSomethingInTheDatabase");
        });
    });

    it("select other by email, admin, exists", function () {
      chai.request(app)
        .get("/users?email=youremail@address.here")
        .set("token", "user1adminToken")
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res).to.have.property("body");

          expect(res.body).to.have.property("userID");
          expect(res.body).to.have.property("email");
          expect(res.body).to.have.property("displayName");
          expect(res.body).to.have.property("identicon");
          expect(res.body).to.have.property("isAdmin");

          expect(res.body.userID).to.be.equal("0000000000000000000000000000000000000000000000000000000000000000");
          expect(res.body.email).to.be.equal("youremail@address.here");
          expect(res.body.displayName).to.be.equal("Name 0");
          expect(res.body.identicon).to.be.equal("/icons/FF6F00.png");
          expect(res.body.isAdmin).to.be.equal(false);
        });
    });

  });
});

describe("/assignments", () => {
  describe("GET /assignments", () => {

    it("Access without any authentication token", function () {
      chai.request(app)
        .get("/assignments")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No authentication token provided");
        });
    });

    it("selection by both", function () {
      chai.request(app)
        .get("/assignments?assignmentID=a&workerID=b")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("You can only select by assignmentID or ownerID");
        });
    });

    it("access from non existing user token", function () {
      chai.request(app)
        .get("/assignments")
        .set("token", "notAnUserToken")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Authentication token belongs to no user");
        });
    });

    it("assignmentID select, doesn't exist", function () {
      chai.request(app)
        .get("/assignments?assignmentID=abc")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No assignment found with assignmentID abc");
        });
    });
    it("assignmentID select, exists, admin", function () {
      chai.request(app)
        .get("/assignments?assignmentID=0000000000000000000000000000000000000000000000000000000000000001")
        .set("token", "user1adminToken")
        .end(function (err, res) {
          expect(res).to.have.status(200);

          expect(res.body).to.have.property("works");
          expect(res.body).to.have.property("markingCategories");
          expect(res.body).to.have.property("assignmentID");
          expect(res.body).to.have.property("title");
          expect(res.body).to.have.property("blurb");
          expect(res.body).to.have.property("submissionOpen");
          expect(res.body).to.have.property("submissionClose");
          expect(res.body).to.have.property("reviewsOpen");
          expect(res.body).to.have.property("reviewsClose");
          expect(res.body).to.have.property("critiquesOpen");
          expect(res.body).to.have.property("critiquesClose");
          expect(res.body).to.have.property("resultsPublish");
          expect(res.body).to.have.property("minReviews");
          expect(res.body).to.have.property("minCritiques");

          expect(res.body.works).to.have.lengthOf(4);
          res.body.works.forEach((work) => {
            expect(work).to.have.property("assignmentID");
            expect(work).to.have.property("workerID");
            expect(work).to.have.property("submissionTime");
          });

          expect(res.body.markingCategories).to.have.lengthOf(2);
          res.body.markingCategories.forEach((cat) => {
            expect(cat).to.have.property("markingCriteria");
            expect(cat).to.have.property("assignmentID");
            expect(cat).to.have.property("categoryID");
            expect(cat).to.have.property("title");
            expect(cat).to.have.property("description");
            cat.markingCriteria.forEach((criteria) => {
              expect(criteria).to.have.property("assignmentID");
              expect(criteria).to.have.property("categoryID");
              expect(criteria).to.have.property("criteriaID");
              expect(criteria).to.have.property("weight");
              expect(criteria).to.have.property("description");
              expect(criteria).to.have.property("subtitle");
            });

          });

          expect(res.body.assignmentID).to.be.equal("0000000000000000000000000000000000000000000000000000000000000001");
          expect(res.body.title).to.be.equal("Project 1");
          expect(res.body.blurb).to.be.equal("This is basically some code that you have to write");
          expect(res.body.submissionOpen).to.be.equal(1554824500557);
          expect(res.body.submissionClose).to.be.equal(2554824500557);
          expect(res.body.reviewsOpen).to.be.equal(1554824500557);
          expect(res.body.reviewsClose).to.be.equal(2554824500557);
          expect(res.body.critiquesOpen).to.be.equal(1554824500557);
          expect(res.body.critiquesClose).to.be.equal(2554824500557);
          expect(res.body.resultsPublish).to.be.equal(2554824500557);
          expect(res.body.minReviews).to.be.equal(4);
          expect(res.body.minCritiques).to.be.equal(10);

        });
    });
    it("assignmentID select, exists, not linked", function () {
      chai.request(app)
        .get("/assignments?assignmentID=0000000000000000000000000000000000000000000000000000000000000005")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("You don't have access to this assignment");
        });
    });
    it("assignmentID select, exists, linked", function () {
      chai.request(app)
        .get("/assignments?assignmentID=0000000000000000000000000000000000000000000000000000000000000001")
        .set("token", "user0token")
        .end(function (err, res) {

          expect(res).to.have.status(200);

          expect(res.body).to.be.deep.equal({
            markingCategories: [{
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "First Criteria",
                description: "Some words 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Second Criteria",
                description: "Some words 2",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              title: "First Category",
              description: "Some words 1",
              weight: 1,
            }, {
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "First Criteria",
                description: "Some words 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Second Criteria",
                description: "Some words 2",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              title: "Second Category",
              description: "This is about how good your code is",
              weight: 1,
            }],
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
            title: "Project 1",
            description: "Some words",
            blurb: "This is basically some code that you have to write",
            submissionOpen: 1554824500557,
            submissionClose: 2554824500557,
            reviewsOpen: 1554824500557,
            reviewsClose: 2554824500557,
            critiquesOpen: 1554824500557,
            critiquesClose: 2554824500557,
            resultsPublish: 2554824500557,
            minReviews: 4,
            minCritiques: 10,
            work: {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: 0,
            },
          });

        });
    });

    it("workerID select, different user, no admin", function () {
      chai.request(app)
        .get("/assignments?workerID=0000000000000000000000000000000000000000000000000000000000000001")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("You can't access this user's assignments");
        });
    });
    it("workerID select", function () {
      chai.request(app)
        .get("/assignments?workerID=0000000000000000000000000000000000000000000000000000000000000000")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(200);

          expect(res.body).to.be.deep.equal([{
            markingCategories: [{
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "Appropriate Parameterisation",
                description: "This is for the quality of the usability of the parameterisation.  It's more about making parameterisation that is easy to work with rather than good for the customisation of component",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Encapsulation",
                description: "The quality of the abstraction of the class.  This means appropriate private fields and appropriate methods to control them safely.",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                weight: 1,
                subtitle: "Useful Methods (Encapsulation of Methods)",
                description: "This is the quality of the methods that the component has and how easy it is to interact with",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              title: "Usability of code",
              description: "This is all about how reusable your code is",
              weight: 1,
            }, {
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "Original Code was Submitted",
                description: "For this criteria 100% is to be given if the original code was submitted and 0% otherwise",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Refactored to Class",
                description: "This criteria is for refactoring the original work into a class.  This is not only the quality of the abstraction of the submitted class but also the difference from the original (if the original is perfectly abstract then this criteria isn't met)",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                weight: 1,
                subtitle: "Parameterisation",
                description: "This criteria is about how well the finished code is parameterised.  If there are a lot of parameters that the user (programmer implementing the code) can control to make meaningful changes to the component",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                weight: 1,
                subtitle: "Extending Scope",
                description: "This criteria is about how much was done to add to the component.  If the component is identical in function to the original then  0%.  Subjectively, if work is done to add meaningful feathers(not trivial implementation) the work should be awarded a good mark",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              title: "Development of Original",
              description: "All about how much you improved the original code",
              weight: 1,
            }, {
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "Valid HTML",
                description: "The code is to be put through a HTML validator, and then given a mark based on the number of errors.  The marker ought to read through the errors that exist to confirm that they are in fact avoidable",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Appropriate Instructions",
                description: "This is a basic user experience criteria, whether the example has explanations giving a user critical information on the user of the component",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                weight: 1,
                subtitle: "Appropriate Controls",
                description: "The example page has appropriate components to control the component",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
              title: "Quality of Example",
              description: "This is about gow good your example was in showcasing your finished code",
              weight: 1,
            }, {
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "Block Documentation",
                description: "All methods have jsDoc comments explaining their the role of the method, its parameters and return",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Explanation of example",
                description: "The implementation of the example is explained",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                weight: 1,
                subtitle: "Licences",
                description: "The source of original code and any code that was used is acknowledged",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
              title: "Quality Documentation",
              description: "This is all about how well documented your code is",
              weight: 1,
            }, {
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "ESLint",
                description: "This criteria is about how well the code does in ESLint.",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Possible Errors",
                description: "This is a negative marking criteria for any issues (potentially unsafe code) that can be found",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                weight: 1,
                subtitle: "Best Practices",
                description: "Check if there exists any needlessly slow or awful code.",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                weight: 1,
                subtitle: "Variables",
                description: "If the variable identifiers are meaningful",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
                weight: 1,
                subtitle: "Style",
                description: "This is to do with the code style.  This means the formatting that doesn't affect how the code runs.",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
                weight: 1,
                subtitle: "ECMScript 6",
                description: "If the ECMScript 6 syntax was used over older, still valid, js",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              title: "Code Quality",
              description: "This is about how good your code is",
              weight: 1,
            }],
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            title: "Programming Summative",
            description: "Subject-specific Knowledge:<br>  Interaction between JavaScript programs and the Document Object Model (DOM)<br>  Using control statements to loop and make decisions.<br>  An understanding of the nature of imperative programming in the object-oriented style.<br>  A knowledge and understanding of good programming practice (for example, reuse, documentation and style)<br>        <br>Key Skills:<br>  an ability to recognise and apply the principles of abstraction and modelling<br>  Tasks<br>  Choose a sketch from openprocessing.org<br>  Adapt it into a reusable component using JavaScript classes<br>        <br>Appropriate constructor:<br>  Get and set methods for properties<br>  draw method with optional p5.Renderer as parameter<br>  Build an example page with properties controlled by form controls<br>  Write documentation of your code using Markdown",
            blurb: "p5 Programming assignment worth 35% of the module",
            submissionOpen: 1554811200000,
            submissionClose: 1554984000000,
            reviewsOpen: 1555070400000,
            reviewsClose: 1560945600000,
            critiquesOpen: 1555502400000,
            critiquesClose: 1560945600000,
            resultsPublish: 1561636800000,
            minReviews: 4,
            minCritiques: 10,
            work: {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: 0,
            },
          }, {
            markingCategories: [{
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "First Criteria",
                description: "Some words 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Second Criteria",
                description: "Some words 2",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              title: "First Category",
              description: "Some words 1",
              weight: 1,
            }, {
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "First Criteria",
                description: "Some words 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Second Criteria",
                description: "Some words 2",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              title: "Second Category",
              description: "This is about how good your code is",
              weight: 1,
            }],
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
            title: "Project 1",
            description: "Some words",
            blurb: "This is basically some code that you have to write",
            submissionOpen: 1554824500557,
            submissionClose: 2554824500557,
            reviewsOpen: 1554824500557,
            reviewsClose: 2554824500557,
            critiquesOpen: 1554824500557,
            critiquesClose: 2554824500557,
            resultsPublish: 2554824500557,
            minReviews: 4,
            minCritiques: 10,
            work: {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: 0,
            },
          }, {
            markingCategories: [{
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "First Criteria",
                description: "Some words 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Second Criteria",
                description: "Some words 2",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              title: "First Category",
              description: "Some words 1",
              weight: 1,
            }, {
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "First Criteria",
                description: "Some words 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Second Criteria",
                description: "Some words 2",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              title: "Second Category",
              description: "This is about how good your code is",
              weight: 1,
            }],
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
            title: "Project 2",
            description: "Some words",
            blurb: "This is basically some code that you have to write",
            submissionOpen: 1554824500557,
            submissionClose: 1554824500557,
            reviewsOpen: 1554824500557,
            reviewsClose: 1554824500557,
            critiquesOpen: 1554824500557,
            critiquesClose: 2554824500557,
            resultsPublish: 2554824500557,
            minReviews: 4,
            minCritiques: 10,
            work: {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: null,
            },
          }, {
            markingCategories: [{
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "First Criteria",
                description: "Some words 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Second Criteria",
                description: "Some words 2",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              title: "First Category",
              description: "Some words 1",
              weight: 1,
            }, {
              markingCriteria: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                weight: 1,
                subtitle: "First Criteria",
                description: "Some words 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                weight: 1,
                subtitle: "Second Criteria",
                description: "Some words 2",
              }],
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              title: "Second Category",
              description: "This is about how good your code is",
              weight: 1,
            }],
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
            title: "Project 3",
            description: "Some words",
            blurb: "This is basically some code that you have to write",
            submissionOpen: 1554734232868,
            submissionClose: 1554824500557,
            reviewsOpen: 0,
            reviewsClose: 0,
            critiquesOpen: 0,
            critiquesClose: 0,
            resultsPublish: 1554824500557,
            minReviews: 4,
            minCritiques: 10,
            work: {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: 0,
            },
          }, {
            markingCategories: [],
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000004",
            title: "Project 4",
            description: "Some words",
            blurb: "This is basically some code that you have to write",
            submissionOpen: 1554824500557,
            submissionClose: 2554824500557,
            reviewsOpen: 1554824500557,
            reviewsClose: 2554824500557,
            critiquesOpen: 2554824500557,
            critiquesClose: 2554824500557,
            resultsPublish: 2554824500557,
            minReviews: 4,
            minCritiques: 10,
            work: {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000004",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: 0,
            },
          }]);

        });
    });
    it("all select, none admin", function () {
      chai.request(app)
        .get("/assignments")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Admin privileges are needed to access all assignments");
        });

    });
    it("all select, admin", function () {
      chai.request(app)
        .get("/assignments")
        .set("token", "user1adminToken")
        .end(function (err, res) {
          expect(res).to.have.status(200);

          // expect(res.body).to.be.deep.equal();

          // TODO this bad boy
        });
    });

  });
});

describe("/reviews", () => {
  describe("GET /reviews", () => {
    it("Access without any authentication token", function () {
      chai.request(app)
        .get("/reviews")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No authentication token provided");
        });
    });

    it("Access without non existing user token", function () {
      chai.request(app)
        .get("/reviews")
        .set("token", "notAnUserToken")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Authentication token belongs to no user");
        });
    });

    it("select all, not admin", function () {
      chai.request(app)
        .get("/reviews")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Admin privileges needed to select all reviews");
        });
    });

    it("select all, as admin", function () {
      chai.request(app)
        .get("/reviews")
        .set("token", "user1adminToken")
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res).to.have.property("body");

          expect(res.body).to.be.deep.equal([{
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 1",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.8,
              comment: "comment 2",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 3",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.8,
              comment: "comment 4",
            }],
            critiques: [{
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.4,
                comment: "comment 1",
                state: 4,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 1,
                comment: "comment 2",
                state: 4,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 3",
                state: 0,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.8,
                comment: "comment 4",
                state: 0,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              criticID: "0000000000000000000000000000000000000000000000000000000000000002",
              submissionTime: 0,
            }, {
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 1,
                comment: "comment 1",
                state: 4,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 1,
                comment: "comment 2",
                state: 4,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 1,
                comment: "comment 3",
                state: 4,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 1,
                comment: "comment 4",
                state: 4,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000003",
                displayName: "Name 3",
                identicon: "/icons/880E4F.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              criticID: "0000000000000000000000000000000000000000000000000000000000000003",
              submissionTime: 0,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000001",
              displayName: "Name 1",
              identicon: "/icons/01579B.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
            workerID: "0000000000000000000000000000000000000000000000000000000000000000",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
            comment: "comment 1",
            submissionTime: 0,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 1",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.8,
              comment: "comment 2",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 3",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.8,
              comment: "comment 4",
            }],
            critiques: [{
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.2,
                comment: "comment 1",
                state: 4,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.2,
                comment: "comment 2",
                state: 4,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.2,
                comment: "comment 3",
                state: 4,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.2,
                comment: "comment 4",
                state: 4,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              criticID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: 0,
            }, {
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 1",
                state: 0,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.8,
                comment: "comment 2",
                state: 0,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 3",
                state: 0,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.8,
                comment: "comment 4",
                state: 0,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000003",
                displayName: "Name 3",
                identicon: "/icons/880E4F.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              criticID: "0000000000000000000000000000000000000000000000000000000000000003",
              submissionTime: 0,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000002",
              displayName: "Name 2",
              identicon: "/icons/33691E.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
            workerID: "0000000000000000000000000000000000000000000000000000000000000000",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
            comment: "comment 1",
            submissionTime: 0,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.05,
              comment: "some comment here 5",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "some comment here 1",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.2,
              comment: "some comment here 2",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.2,
              comment: "some comment here 3",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "some comment here 4",
            }],
            critiques: [],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000000",
              displayName: "Name 0",
              identicon: "/icons/FF6F00.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            workerID: "0000000000000000000000000000000000000000000000000000000000000001",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
            comment: "comment 1",
            submissionTime: null,
          }, {
            grades: [],
            critiques: [],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: null,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000000",
              displayName: "Name 0",
              identicon: "/icons/FF6F00.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
            workerID: "0000000000000000000000000000000000000000000000000000000000000001",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
            comment: "comment 1",
            submissionTime: 0,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "some comment here 6",
            }],
            critiques: [{
              critiquedGrades: [],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              criticID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: 0,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000000",
              displayName: "Name 0",
              identicon: "/icons/FF6F00.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            workerID: "0000000000000000000000000000000000000000000000000000000000000002",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
            comment: "comment 2",
            submissionTime: 0,
          }, {
            grades: [],
            critiques: [{
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000003",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0,
                comment: "with all those warnings he deserves nothing, no effort!",
                state: 1,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              criticID: "0000000000000000000000000000000000000000000000000000000000000002",
              submissionTime: null,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000003",
                displayName: "Name 3",
                identicon: "/icons/880E4F.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000001",
              displayName: "Name 1",
              identicon: "/icons/01579B.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            workerID: "0000000000000000000000000000000000000000000000000000000000000003",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
            comment: "comment 3",
            submissionTime: null,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 1",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 2",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 3",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 4",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 5",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 6",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
              mark: 0.5,
              comment: "comment 7",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 8",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 9",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 10",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 11",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 12",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 13",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 14",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 15",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 16",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
              mark: 0.5,
              comment: "comment 17",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
              mark: 0.5,
              comment: "comment 18",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
              mark: 0.5,
              comment: "comment 19",
            }],
            critiques: [{
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 1",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 2",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 3",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 4",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 5",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 6",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                proposedMark: 0.5,
                comment: "comment 7",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 8",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 9",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 10",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 11",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 12",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 13",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 14",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 15",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 16",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                proposedMark: 0.5,
                comment: "comment 17",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
                proposedMark: 0.5,
                comment: "comment 18",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
                proposedMark: 0.5,
                comment: "comment 19",
                state: 1,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              criticID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: null,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000001",
              displayName: "Name 1",
              identicon: "/icons/01579B.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            workerID: "0000000000000000000000000000000000000000000000000000000000000002",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
            comment: "comment 4",
            submissionTime: 0,
          }, {
            grades: [],
            critiques: [{
              critiquedGrades: [],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              criticID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: null,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000003",
                displayName: "Name 3",
                identicon: "/icons/880E4F.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000002",
              displayName: "Name 2",
              identicon: "/icons/33691E.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            workerID: "0000000000000000000000000000000000000000000000000000000000000003",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
            comment: "comment 5",
            submissionTime: 0,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 1",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 2",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 3",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 4",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 5",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 6",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
              mark: 0.5,
              comment: "comment 7",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 8",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 9",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 10",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 11",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 12",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 13",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 14",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 15",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
              mark: 0.5,
              comment: "comment 16",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
              mark: 0.5,
              comment: "comment 17",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
              mark: 0.5,
              comment: "comment 18",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
              mark: 0.5,
              comment: "comment 19",
            }],
            critiques: [{
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 1",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 2",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 3",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 4",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 5",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 6",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                proposedMark: 0.5,
                comment: "comment 7",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 8",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 9",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 10",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 11",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 12",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 13",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "comment 14",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.5,
                comment: "comment 15",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                proposedMark: 0.5,
                comment: "comment 16",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                proposedMark: 0.5,
                comment: "comment 17",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
                proposedMark: 0.5,
                comment: "comment 18",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
                proposedMark: 0.5,
                comment: "comment 19",
                state: 1,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              criticID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: 0,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000002",
              displayName: "Name 2",
              identicon: "/icons/33691E.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            workerID: "0000000000000000000000000000000000000000000000000000000000000001",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
            comment: "comment 6",
            submissionTime: 0,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "some comment here 7",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "some comment here 8",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "some comment here 7",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "some comment here 8",
            }],
            critiques: [],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000000",
              displayName: "Name 0",
              identicon: "/icons/FF6F00.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
            workerID: "0000000000000000000000000000000000000000000000000000000000000001",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
            comment: "comment 7",
            submissionTime: null,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "some comment here B",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "some comment here B",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "some comment here C",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "some comment here D",
            }],
            critiques: [{
              critiquedGrades: [],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              criticID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: 0,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000000",
              displayName: "Name 0",
              identicon: "/icons/FF6F00.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
            workerID: "0000000000000000000000000000000000000000000000000000000000000002",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
            comment: "comment 8",
            submissionTime: 0,
          }, {
            grades: [],
            critiques: [{
              critiquedGrades: [],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              criticID: "0000000000000000000000000000000000000000000000000000000000000002",
              submissionTime: null,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000003",
                displayName: "Name 3",
                identicon: "/icons/880E4F.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              submissionTime: null,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000001",
              displayName: "Name 1",
              identicon: "/icons/01579B.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
            workerID: "0000000000000000000000000000000000000000000000000000000000000003",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
            comment: "comment 9",
            submissionTime: 0,
          }, {
            grades: [],
            critiques: [{
              critiquedGrades: [],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              criticID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: null,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000003",
                displayName: "Name 3",
                identicon: "/icons/880E4F.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              submissionTime: null,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000002",
              displayName: "Name 2",
              identicon: "/icons/33691E.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
            workerID: "0000000000000000000000000000000000000000000000000000000000000003",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
            comment: "comment 10",
            submissionTime: 0,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 1",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 1",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 1",
            }],
            critiques: [{
              critiquedGrades: [],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              criticID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: null,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000002",
              displayName: "Name 2",
              identicon: "/icons/33691E.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
            workerID: "0000000000000000000000000000000000000000000000000000000000000001",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
            comment: "comment 11",
            submissionTime: 0,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "comment 1",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "comment 1",
            }],
            critiques: [{
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0,
                comment: "cGrade 0, pending",
                state: 0,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              criticID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: null,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000001",
              displayName: "Name 1",
              identicon: "/icons/01579B.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
            workerID: "0000000000000000000000000000000000000000000000000000000000000002",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
            comment: "comment 12",
            submissionTime: 0,
          }, {
            grades: [{
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "some comment here B",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
              mark: 0.5,
              comment: "some comment here B",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "some comment here C",
            }, {
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
              criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
              mark: 0.5,
              comment: "some comment here D",
            }],
            critiques: [{
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.5,
                comment: "cGrade 5, agreeing",
                state: 0,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.1,
                comment: "cGrade 1, disagreeing",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.1,
                comment: "cGrade 2, accepted",
                state: 2,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.1,
                comment: "cGrade 3, rejected",
                state: 3,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000003",
                displayName: "Name 3",
                identicon: "/icons/880E4F.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              criticID: "0000000000000000000000000000000000000000000000000000000000000003",
              submissionTime: 0,
            }, {
              critiquedGrades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.1,
                comment: "cGrade 4, disagreeing",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.1,
                comment: "cGrade 5, disagreeing",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                proposedMark: 0.1,
                comment: "cGrade 6, disagreeing",
                state: 1,
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                proposedMark: 0.1,
                comment: "cGrade 7, agreeing",
                state: 0,
              }],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000004",
                displayName: "Name 4",
                identicon: "/icons/F57F17.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              criticID: "0000000000000000000000000000000000000000000000000000000000000004",
              submissionTime: 0,
            }],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              submissionTime: null,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000000",
              displayName: "Name 0",
              identicon: "/icons/FF6F00.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
            workerID: "0000000000000000000000000000000000000000000000000000000000000001",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
            comment: "comment 4",
            submissionTime: 1554824500557,
          }]);

        });
    });

    it("select by none self owner", function () {
      chai.request(app)
        .get("/reviews?ownerID=0000000000000000000000000000000000000000000000000000000000000001")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Admin privileges are needed to select by a none self owner");
        });
    });

    it("select by none existing owner", function () {
      chai.request(app)
        .get("/reviews?ownerID=1111111111111111111111111111111111111111111111111111111111111111")
        .set("token", "user1adminToken")
        .end(function (err, res) {
          expect(res).to.have.status(404);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No such user exists");
        });
    });

    it("select by owner, valid", function () {
      chai.request(app)
        .get("/reviews?ownerID=0000000000000000000000000000000000000000000000000000000000000000")
        .set("token", "user0token")
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res).to.have.property("body");

          expect(res.body).to.be.deep.equal({
            worker: [{
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.8,
                comment: "comment 2",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 3",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.8,
                comment: "comment 4",
              }],
              critiques: [{
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.4,
                  comment: "comment 1",
                  state: 4,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 1,
                  comment: "comment 2",
                  state: 4,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 3",
                  state: 0,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.8,
                  comment: "comment 4",
                  state: 0,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000002",
                  displayName: "Name 2",
                  identicon: "/icons/33691E.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000002",
                submissionTime: 0,
              }, {
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 1,
                  comment: "comment 1",
                  state: 4,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 1,
                  comment: "comment 2",
                  state: 4,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 1,
                  comment: "comment 3",
                  state: 4,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 1,
                  comment: "comment 4",
                  state: 4,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000003",
                  displayName: "Name 3",
                  identicon: "/icons/880E4F.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                submissionTime: 0,
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000000",
                  displayName: "Name 0",
                  identicon: "/icons/FF6F00.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              comment: "comment 1",
              submissionTime: 0,
            }, {
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.8,
                comment: "comment 2",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 3",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.8,
                comment: "comment 4",
              }],
              critiques: [{
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.2,
                  comment: "comment 1",
                  state: 4,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.2,
                  comment: "comment 2",
                  state: 4,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.2,
                  comment: "comment 3",
                  state: 4,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.2,
                  comment: "comment 4",
                  state: 4,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: 0,
              }, {
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 1",
                  state: 0,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.8,
                  comment: "comment 2",
                  state: 0,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 3",
                  state: 0,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.8,
                  comment: "comment 4",
                  state: 0,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000003",
                  displayName: "Name 3",
                  identicon: "/icons/880E4F.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                submissionTime: 0,
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000000",
                  displayName: "Name 0",
                  identicon: "/icons/FF6F00.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000000",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000000",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              comment: "comment 1",
              submissionTime: 0,
            }], "reviewer": [{
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.05,
                comment: "some comment here 5",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "some comment here 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.2,
                comment: "some comment here 2",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.2,
                comment: "some comment here 3",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "some comment here 4",
              }],
              critiques: [],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              comment: "comment 1",
              submissionTime: null,
            }, {
              grades: [],
              critiques: [],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: null,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              comment: "comment 1",
              submissionTime: 0,
            }, {
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "some comment here 6",
              }],
              critiques: [{
                critiquedGrades: [],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: 0,
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000002",
                  displayName: "Name 2",
                  identicon: "/icons/33691E.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              comment: "comment 2",
              submissionTime: 0,
            }, {
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "some comment here 7",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "some comment here 8",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "some comment here 7",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "some comment here 8",
              }],
              critiques: [],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              comment: "comment 7",
              submissionTime: null,
            }, {
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "some comment here B",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "some comment here B",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "some comment here C",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "some comment here D",
              }],
              critiques: [{
                critiquedGrades: [],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: 0,
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000002",
                  displayName: "Name 2",
                  identicon: "/icons/33691E.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              comment: "comment 8",
              submissionTime: 0,
            }, {
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "some comment here B",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "some comment here B",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "some comment here C",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "some comment here D",
              }],
              critiques: [{
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "cGrade 5, agreeing",
                  state: 0,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.1,
                  comment: "cGrade 1, disagreeing",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.1,
                  comment: "cGrade 2, accepted",
                  state: 2,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.1,
                  comment: "cGrade 3, rejected",
                  state: 3,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000003",
                  displayName: "Name 3",
                  identicon: "/icons/880E4F.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000003",
                submissionTime: 0,
              }, {
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.1,
                  comment: "cGrade 4, disagreeing",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.1,
                  comment: "cGrade 5, disagreeing",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.1,
                  comment: "cGrade 6, disagreeing",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.1,
                  comment: "cGrade 7, agreeing",
                  state: 0,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000004",
                  displayName: "Name 4",
                  identicon: "/icons/F57F17.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
                criticID: "0000000000000000000000000000000000000000000000000000000000000004",
                submissionTime: 0,
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: null,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
              comment: "comment 4",
              submissionTime: 1554824500557,
            }], "critic": [{
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 2",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 3",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 4",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 5",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 6",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                mark: 0.5,
                comment: "comment 7",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 8",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 9",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 10",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 11",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 12",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 13",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 14",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 15",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 16",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                mark: 0.5,
                comment: "comment 17",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
                mark: 0.5,
                comment: "comment 18",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
                mark: 0.5,
                comment: "comment 19",
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000002",
                  displayName: "Name 2",
                  identicon: "/icons/33691E.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              comment: "comment 4",
              submissionTime: 0,
              critique: {
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 1",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 2",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 3",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 4",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 5",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 6",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                  proposedMark: 0.5,
                  comment: "comment 7",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 8",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 9",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 10",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 11",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 12",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 13",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 14",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 15",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 16",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                  proposedMark: 0.5,
                  comment: "comment 17",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
                  proposedMark: 0.5,
                  comment: "comment 18",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
                  proposedMark: 0.5,
                  comment: "comment 19",
                  state: 1,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000000",
                  displayName: "Name 0",
                  identicon: "/icons/FF6F00.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                submissionTime: null,
              },
            }, {
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 2",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 3",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 4",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 5",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 6",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                mark: 0.5,
                comment: "comment 7",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 8",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 9",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 10",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 11",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 12",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 13",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 14",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 15",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                mark: 0.5,
                comment: "comment 16",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                mark: 0.5,
                comment: "comment 17",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
                mark: 0.5,
                comment: "comment 18",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
                mark: 0.5,
                comment: "comment 19",
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              comment: "comment 6",
              submissionTime: 0,
              critique: {
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 1",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 2",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 3",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 4",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 5",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 6",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                  proposedMark: 0.5,
                  comment: "comment 7",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 8",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 9",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 10",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 11",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 12",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000003",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 13",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0.5,
                  comment: "comment 14",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                  proposedMark: 0.5,
                  comment: "comment 15",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000002",
                  proposedMark: 0.5,
                  comment: "comment 16",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000003",
                  proposedMark: 0.5,
                  comment: "comment 17",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000004",
                  proposedMark: 0.5,
                  comment: "comment 18",
                  state: 1,
                }, {
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000004",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000005",
                  proposedMark: 0.5,
                  comment: "comment 19",
                  state: 1,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000000",
                  displayName: "Name 0",
                  identicon: "/icons/FF6F00.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                submissionTime: 0,
              },
            }, {
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000001",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 1",
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000001",
                  displayName: "Name 1",
                  identicon: "/icons/01579B.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000002",
                displayName: "Name 2",
                identicon: "/icons/33691E.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000001",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              comment: "comment 11",
              submissionTime: 0,
              critique: {
                critiquedGrades: [],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000000",
                  displayName: "Name 0",
                  identicon: "/icons/FF6F00.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000001",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                submissionTime: null,
              },
            }, {
              grades: [{
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                mark: 0.5,
                comment: "comment 1",
              }, {
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
                mark: 0.5,
                comment: "comment 1",
              }],
              work: {
                worker: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000002",
                  displayName: "Name 2",
                  identicon: "/icons/33691E.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                submissionTime: 0,
              },
              reviewer: {
                userID: "0000000000000000000000000000000000000000000000000000000000000001",
                displayName: "Name 1",
                identicon: "/icons/01579B.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
              workerID: "0000000000000000000000000000000000000000000000000000000000000002",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
              comment: "comment 12",
              submissionTime: 0,
              critique: {
                critiquedGrades: [{
                  assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                  workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                  reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                  criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
                  criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
                  proposedMark: 0,
                  comment: "cGrade 0, pending",
                  state: 0,
                }],
                critic: {
                  userID: "0000000000000000000000000000000000000000000000000000000000000000",
                  displayName: "Name 0",
                  identicon: "/icons/FF6F00.png",
                },
                assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
                workerID: "0000000000000000000000000000000000000000000000000000000000000002",
                reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
                criticID: "0000000000000000000000000000000000000000000000000000000000000000",
                submissionTime: null,
              },
            }],
          },
          );
        });
    });

  });

  describe("POST /reviews", () => {
    it("Access without any authentication token", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .send({})
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No authentication token provided");
        });
    });

    it("missing assignmentID", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({})
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("assignmentID was undefined");
        });
    });

    it("wrong type assignmentID", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: 2,
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("assignmentID must be of type string");
        });
    });

    it("not defined reviewerID nor criticID", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "",
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("define reviewerID or criticID to create a review or critique");
        });
    });

    it("wrong type reviewerID", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "",
          reviewerID: 2,
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("reviewerID must be of type string");
        });
    });

    it("wrong type criticID", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "",
          criticID: 2,
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("criticID must be of type string");
        });
    });

    it("defined both reviewerID and criticID", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "",
          reviewerID: "",
          criticID: "",
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Only one of criticID and reviewerID must be defined");
        });
    });

    it("Access without non existing user token", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "notAnUserToken")
        .send({
          assignmentID: "",
          reviewerID: "",
        })
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Authentication token belongs to no user");
        });
    });

    it("assignment doesn't exist", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "",
          reviewerID: "",
        })
        .end(function (err, res) {
          expect(res).to.have.status(404);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No such assignment exists");
        });
    });

    it("start review for other user, not admin", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
          reviewerID: "0000000000000000000000000000000000000000000000000000000000000001",
        })
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Admin privilege needed to start reviews for other users");
        });
    });

    it("start critique for other user, not admin", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
          criticID: "0000000000000000000000000000000000000000000000000000000000000001",
        })
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Admin privilege needed to start critiques for other users");
        });
    });

    it("start review, outside of review period", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
          reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Not possible to start review outside of the review period");
        });
    });

    it("start critique, outside of critique period", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000003",
          criticID: "0000000000000000000000000000000000000000000000000000000000000000",
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Not possible to start critique outside of the review period");
        });
    });

    it("start review, user doesn't have work", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000005",
          reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Can't start a review for an assignment the user isn't assigned to");
        });
    });

    it("start review, user doesn't exist", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user1adminToken")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000005",
          reviewerID: "1",
        })
        .end(function (err, res) {
          expect(res).to.have.status(404);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No such reviewer user exists");
        });
    });

    it("start review, no more work left", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user1adminToken")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
          reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
        })
        .end(function (err, res) {

          expect(res).to.have.status(503);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No works left to review");
        });
    });

    it("start review, success", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user1adminToken")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
          reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
        })
        .end(function (err, res) {

          expect(res).to.have.status(200);
          expect(res).to.have.property("body");

          expect(res.body).to.deep.equal({
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            workerID: "0000000000000000000000000000000000000000000000000000000000000004",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
            comment: null,
            submissionTime: null,
            grades: [],
            critiques: [],
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000000",
              displayName: "Name 0",
              identicon: "/icons/FF6F00.png",
            },
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000004",
                displayName: "Name 4",
                identicon: "/icons/F57F17.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000004",
              submissionTime: "0000000000000000000000000000000000000000000000000000000000000000",
            },
          });

        });
    });


    it("start critique, user doesn't exist", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000005",
          criticID: "0000000000000000000000000000000000000000000000000000000000000000",
        })
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("Can't start a critique for an assignment the user isn't assigned to");
        });
    });

    it("start review, user doesn't exist", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user1adminToken")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000005",
          criticID: "1",
        })
        .end(function (err, res) {
          expect(res).to.have.status(404);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No such critic user exists");
        });
    });

    it("start critique, no more reviews left", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user1adminToken")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
          criticID: "0000000000000000000000000000000000000000000000000000000000000000",
        })
        .end(function (err, res) {
          expect(res).to.have.status(503);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No reviews left to critique");
        });
    });

    it("start critique, success", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user1adminToken")
        .send({
          assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
          criticID: "0000000000000000000000000000000000000000000000000000000000000000",
        })
        .end(function (err, res) {

          expect(res).to.have.status(200);
          expect(res).to.have.property("body");

          expect(res.body).to.be.deep.equal({
            grades: [],
            work: {
              worker: {
                userID: "0000000000000000000000000000000000000000000000000000000000000003",
                displayName: "Name 3",
                identicon: "/icons/880E4F.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              submissionTime: 0,
            },
            reviewer: {
              userID: "0000000000000000000000000000000000000000000000000000000000000002",
              displayName: "Name 2",
              identicon: "/icons/33691E.png",
            },
            assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
            workerID: "0000000000000000000000000000000000000000000000000000000000000003",
            reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
            comment: "comment 5",
            submissionTime: 0,
            critique: {
              critiquedGrades: [],
              critic: {
                userID: "0000000000000000000000000000000000000000000000000000000000000000",
                displayName: "Name 0",
                identicon: "/icons/FF6F00.png",
              },
              assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
              workerID: "0000000000000000000000000000000000000000000000000000000000000003",
              reviewerID: "0000000000000000000000000000000000000000000000000000000000000002",
              criticID: "0000000000000000000000000000000000000000000000000000000000000000",
              submissionTime: null,
            },
          });

        });
    });

  });

  describe("PATCH /reviews", () => {
    it("Access without any authentication token", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .send({})
        .end(function (err, res) {
          expect(res).to.have.status(403);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("No authentication token provided");
        });
    });

    it("missing assignmentID", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({})
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("assignmentID was undefined");
        });
    });

    it("wrong type assignmentID", function () {
      chai.request(app)
        .post("/reviews")
        .set("content-type", "application/json")
        .set("token", "user0token")
        .send({})
        .end(function (err, res) {
          expect(res).to.have.status(400);
          expect(res).to.have.property("body");
          expect(res.body).to.have.property("message");
          expect(res.body.message).to.be.equal("assignmentID was undefined");
        });
    });

    // TODO finish all these tests
    // If these tests are not done in the submitted version then I hope that the size of the project justifies why
    // they're not done, and that the quality of the rest of the tests can be extrapolated

  });
});

describe("/critiques", () => {
  describe("POST /critiques", () => {
    it("Access without any authentication token", function () {
    });

    it("Access without non existing user token", function () { // TODO
    });

  });
});

describe("/work", () => {
  describe("POST /work", () => {
    it("Access without any authentication token", function () {
    });

  });

  describe("GET /work", () => {
    it("Access without any authentication token", function () {
    });
    it("Access without non existing user token", function () { // TODO
    });

  });
});


//.set("token", "notAnUserToken")
//.set("token", "user0token")
//.set("token", "user1adminToken")
//