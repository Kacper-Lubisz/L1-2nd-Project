const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const authentication = require("../authentication");
const data = require("../database");

router.post('/', async function (req, res, next) {

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
                        console.error(error);
                    } else {
                        uploadingWork.submissionTime = currentTime;
                        res.status(200).json(uploadingWork);
                    }
                });

            }
        }
    }
});

module.exports = router;
