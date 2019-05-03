const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const authentication = require("../authentication");
const data = require("../database");

/**
 * POST '/work'
 * See apidocs.md
 */
router.post("/", async function (req, res, next) {

  try {

    const auth = await authentication.verify(req.headers.token);
    if (auth === undefined) { // insufficient permissions, no permission
      res.status(403).json({message: "Invalid or no authentication token"});
    } else if (req.files === null || req.files.file === undefined) {
      res.status(400).json({message: "No file was uploaded"});
    } else if (req.files.file.mimetype !== "application/x-zip-compressed") {
      res.status(400).json({message: "The submitted file must be a zip file"});
    } else if (req.body.workerID === undefined) {
      res.status(400).json({message: "workerID was missing"});
    } else if (typeof req.body.workerID !== "string") {
      res.status(400).json({message: "workerID must be of type string"});
    } else if (req.body.assignmentID === undefined) {
      res.status(400).json({message: "workerID was missing"});
    } else if (typeof req.body.assignmentID !== "string") {
      res.status(400).json({message: "workerID must be of type string"});
    } else {

      const uploadingUser = data.users.find((user) => user.email === auth.email);
      const uploadingWork = data.work.find((work) => work.workerID === req.body.workerID
                && work.assignmentID === req.body.assignmentID);

      if (uploadingUser === undefined) {
        res.status(403).json({message: "Invalid authentication token, user doesn't exist"});
      } else if (uploadingWork === undefined) {
        res.status(404).json({message: "No matching work found"});
      } else if (uploadingWork.workerID !== uploadingUser.userID && !uploadingUser.isAdmin) {
        res.status(403).json({message: "Invalid authentication token, admin privilege required for this action"});
      } else {

        const assigment = data.assignments.find((assignment) =>
          assignment.assignmentID === uploadingWork.assignmentID);
        const currentTime = new Date().getTime();

        if (assigment === undefined) {
          res.status(500).json({message: "Server error, inconsistent database error"});
        } else if (currentTime < assigment.submissionOpen || assigment.submissionClose < currentTime) {
          res.status(400).json({message: "The submission period has passed"});
        } else {

          const dirPath = path.join(__dirname, "../work/", assigment.assignmentID);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
          }
          req.files.file.mv(`${dirPath}/${uploadingWork.workerID}.zip`, function (error) {
            if (error !== undefined) {
              res.status(500).json({message: "Error in processing the file"});
            } else {
              uploadingWork.submissionTime = currentTime;
              res.status(200).json(uploadingWork);
            }
          });

        }
      }
    }

  } catch (e) {
    next(e);
  }
});

/**
 * GET '/work'
 * See apidocs.md
 */
router.get("/:assignmentID/:workerID", async function (req, res) {

  try {

    const auth = await authentication.verify(req.headers.token);

    if (auth === undefined) { // insufficient permissions, no permission
      res.status(403).json({message: "Invalid or no authentication token"});
    } else if (req.params.assignmentID === undefined) {
      res.status(400).json({message: "assignmentID was undefined"});
    } else if (typeof req.params.assignmentID !== "string") {
      res.status(400).json({message: "assignmentID must be of type string"});
    } else if (req.params.workerID === undefined) {
      res.status(400).json({message: "workerID was undefined"});
    } else if (typeof req.params.workerID !== "string") {
      res.status(400).json({message: "workerID must be of type string"});
    } else {
      const selectingUser = data.users.find((user) => user.email === auth.email);
      const selectedWork = data.work.find((work) => work.assignmentID === req.params.assignmentID &&
                work.workerID === req.params.workerID);

      if (selectingUser === undefined) {
        res.status(403).json({message: "Invalid authentication token, user doesn't exist"});
      } else if (selectedWork === undefined) {
        res.status(404).json({message: "No such work found"});
      } else {
        // must determine if the selecting user has access to this work

        if (selectingUser.isAdmin
                    || (selectedWork.workerID === selectingUser.userID)
                    || (data.reviews.some((review) =>
                      review.assignmentID === req.params.assignmentID &&
                        review.workerID === req.params.workerID &&
                        review.reviewerID === selectingUser.userID))
                    || (data.critiques.some((critique) =>
                      critique.assignmentID === req.params.assignmentID &&
                        critique.workerID === req.params.workerID &&
                        critique.criticID === selectingUser.userID))) {

          // four conditions under which the user is granted access
          // the if is nasty as an optimisation, since not all of it needs evaluating
          // 1) the selecting user is an admin
          // 2) they are the owner of the work
          // 3) they are a reviewer of the work
          // 4) they are a critic of the work

          res.sendFile(path.join(__dirname, "../work/", `${selectedWork.assignmentID}/${
            selectedWork.workerID}.zip`));

        } else {
          res.status(403).json({message: "Invalid authentication token, you don't have access to this work"});
        }
      }
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
