const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const authentication = require("../authentication");
const data = require("../database");

/**
 * This router is used for serving work to users
 */
router.get('/:assignmentID/:workerID', async function (req, res, next) {

    const auth = await authentication.verify(req.headers.token);

    if (auth === undefined) { // insufficient permissions, no permission
        res.status(403).json({message: "Invalid or no authentication token"});
    } else if (req.params.assignmentID === undefined || typeof req.params.assignmentID !== "string"
        || req.params.workerID === undefined || typeof req.params.workerID !== "string") {
        res.status(404).json({message: "No such work found"});
    } else {
        const selectingUser = data.users.find((user) => user.email === auth.email);
        const selectedWork = data.work.find((work) => work.assignmentID === req.params.assignmentID &&
            work.workerID === req.params.workerID);

        if (selectingUser === undefined) {
            res.status(403).json({message: "Invalid authentication token, user doesn't exist"});
        } else if (selectedWork === undefined) {
            res.status(404).json({message: "No matching work found"});
        } else {
            // must determine if the selecting user has access to this work

            if (selectingUser.isAdmin
                || (selectedWork.workerID === selectingUser.userID)
                || (data.reviews.some((review) =>
                    review.assignmentID === req.para.assignmentID &&
                    review.workerID === req.params.workerID &&
                    review.reviewerID === selectingUser.userID))
                || (data.critiques.some((critique) =>
                    critique.assignmentID === req.para.assignmentID &&
                    critique.workerID === req.params.workerID &&
                    critique.criticID === selectingUser.userID))) {

                // four conditions under which the user is granted access
                // the if is nasty as an optimisation, since not all of it needs evaluating
                // 1) the selecting user is an admin
                // 2) they are the owner of the work
                // 3) they are a reviewer of the work
                // 4) they are a critic of the work

                res.sendFile(path.join(__dirname, '../work/', `${selectedWork.assignmentID}/${
                    selectedWork.workerID}.zip`));

            } else {
                res.status(403).json({message: "Invalid authentication token, you don't have access to this work"});
            }
        }
    }
});

module.exports = router;
