const express = require("express");
const router = express.Router();

const authentication = require("../authentication");
const data = require("../database");

/**
 * POST '/critiques'
 * See apidocs.md
 */
router.post("/", async function (req, res, next) {

  try {

    const auth = await authentication.verify(req.headers.token);

    // TODO all of these checks can be done with a library such as express validator, would defiantly do that if I had
    // infinite time for this project
    if (auth === undefined) {
      res.status(403).json({message: "Invalid authentication token"});
    } else if (req.body.assignmentID === undefined) {
      res.status(400).json({message: "assignmentID was undefined"});
    } else if (typeof req.body.assignmentID !== "string") {
      res.status(400).json({message: "assignmentID must be of type string"});
    } else if (req.body.workerID === undefined) {
      res.status(400).json({message: "workerID was undefined"});
    } else if (typeof req.body.workerID !== "string") {
      res.status(400).json({message: "workerID must be of type string"});
    } else if (req.body.reviewerID === undefined) {
      res.status(400).json({message: "reviewerID was undefined"});
    } else if (typeof req.body.reviewerID !== "string") {
      res.status(400).json({message: "reviewerID must be of type string"});
    } else if (req.body.criticID === undefined) {
      res.status(400).json({message: "criticID was undefined"});
    } else if (typeof req.body.criticID !== "string") {
      res.status(400).json({message: "criticID must be of type string"});
    } else if (req.body.categoryID === undefined) {
      res.status(400).json({message: "categoryID was undefined"});
    } else if (typeof req.body.categoryID !== "string") {
      res.status(400).json({message: "categoryID must be of type string"});
    } else if (req.body.criteriaID === undefined) {
      res.status(400).json({message: "criteriaID was undefined"});
    } else if (typeof req.body.criteriaID !== "string") {
      res.status(400).json({message: "criteriaID must be of type string"});
    } else if (req.body.state === undefined) {
      res.status(400).json({message: "state was undefined"});
    } else if (typeof req.body.state !== "number" || !Number.isInteger(req.body.state)) {
      res.status(400).json({message: "state must be of type integer"});
    } else if (req.body.state !== 2 && req.body.state !== 3) {
      res.status(400).json({message: "state must be one of {2, 3} (accept, reject resp.)"});

    } else {

      const updatingUser = data.users.find((user) => user.email === auth.email);
      const cGrade = data.critiquedGrades.find((cGrade) => // the critiqued grade that is edited
        cGrade.assignmentID === req.body.assignmentID &&
                cGrade.workerID === req.body.workerID &&
                cGrade.reviewerID === req.body.reviewerID &&
                cGrade.criticID === req.body.criticID &&
                cGrade.categoryID === req.body.categoryID &&
                cGrade.criteriaID === req.body.criteriaID,
      );
      const assignment = data.assignments.find((assignment) => assignment.assignmentID === req.body.assignmentID);
      const currentTime = new Date().getTime();

      if (updatingUser === undefined) {
        res.status(403).json({message: "Invalid authentication token, user doesn't exist"});
      } else if (cGrade === undefined) {
        res.status(404).json({message: "No such critique exists"}); // if the critique exists, so will the assign.
      } else if (currentTime > assignment.resultsPublish && !updatingUser.isAdmin) {
        res.status(403).json({message: "Admin privilege is needed to accept critiques outside the submission period"});
      } else if (updatingUser.userID !== req.body.reviewerID && !updatingUser.isAdmin) {
        res.status(403).json({message: "Admin privilege is needed to update other user's reviews"});
      } else {
        cGrade.state = req.body.state;

        res.status(200).end();
      }

    }
  } catch (e) {
    next(e);
  }

});

module.exports = router;
