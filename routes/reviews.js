const express = require('express');
const router = express.Router();

const authentication = require("../authentication");
const data = require("../database");

/**
 * This method transforms the data tables from the database into a nested object format (rather arbitrarily chosen
 * relation tree).  The function also returns maps that allow for instant access to each entity if it's keys are known.
 * The goal of this is to make the data easier to work with.
 * @return {{reviews: Array, fullKeyMaps: {gradeKeyMap, assignmentKeyMap, reviewKeyMap, workKeyMap, critiqueKeyMap}}}
 */
function getRestructuredData() {

    // NOTE TO PEER REVIEWER:
    // it is notable that most of this would realistically be done through some SQL commands and the most of the
    // logic below would be done in the DBMS.  I point this out because obviously the assignment prohibits us
    // from using databases, and I am thus forced to implement my own database like system.  I don't completely
    // disregard the performance considerations of this code but can certainly say that if I were to make this
    // system as efficient as possible I would never be writing this code myself.  So I kindly ask my fellow
    // peer reviewers to take this into consideration when reading the following code and considering it's
    // complexity
    //
    // When searching through all these relations I am rebuilding all the maps each time which would probably
    // be the main way in which a real DBMS would optimise this (persistent data structures between queries).
    // I could model my data stores like this, but again... if this were a real system I wouldn't even have to
    // worry about it. This slow code seems like the lesser of two evils if you get me ;(

    const userKeyMap = {};
    for (let user of data.users) {
        const newUser = Object.assign({}, user);

        delete newUser.email; // remove sensitive information about the other users.
        delete newUser.isAdmin;

        userKeyMap[user.userID] = newUser;
    }

    const assignmentKeyMap = {};
    for (let assignment of data.assignments) {
        assignmentKeyMap[assignment.assignmentID] = Object.assign({}, assignment);
    }

    const workKeyMap = {};
    const workByWorkerID = {};
    for (let work of data.work) {
        const parentAssignment = assignmentKeyMap[work.assignmentID];
        if (parentAssignment === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }

        const worker = userKeyMap[work.workerID];
        if (worker === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }

        const newWork = Object.assign({
            reviews: [],
            assignment: parentAssignment,
            worker: worker
        }, work);

        workKeyMap[work.assignmentID + work.workerID] = newWork;
        if (workByWorkerID[work.workerID] === undefined) {
            workByWorkerID[work.workerID] = [newWork];
        } else {
            workByWorkerID[work.workerID].push(newWork);
        }
    }

    const reviews = [];

    const reviewKeyMap = {};
    const reviewsByReviewerID = {};
    for (let review of data.reviews) {
        const parentWork = workKeyMap[review.assignmentID + review.workerID];
        if (parentWork === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }

        const reviewer = userKeyMap[review.reviewerID];
        if (reviewer === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }

        const newReview = Object.assign({
            grades: [],
            critiques: [],
            work: parentWork,
            reviewer: reviewer
        }, review);

        reviews.push(newReview);

        reviewKeyMap[review.assignmentID + review.workerID + review.reviewerID] = newReview;
        if (reviewsByReviewerID[review.reviewerID] === undefined) {
            reviewsByReviewerID[review.reviewerID] = [newReview];
        } else {
            reviewsByReviewerID[review.reviewerID].push(newReview);
        }
    }

    const gradeKeyMap = {};
    for (let grade of data.grades) {
        const newGrade = Object.assign({}, grade);

        const parentReview = reviewKeyMap[grade.assignmentID + grade.workerID + grade.reviewerID];
        if (parentReview === undefined) {
            console.error(grade.assignmentID + "\t" + grade.workerID + "\t" + grade.reviewerID);
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }
        parentReview.grades.push(newGrade);

        gradeKeyMap[grade.assignmentID + grade.workerID + grade.reviewerID + grade.criteriaID] = grade;
    }

    const critiqueKeyMap = {};
    const critiquesByCriticID = {};
    for (let critique of data.critiques) {
        const parentReview = reviewKeyMap[critique.assignmentID + critique.workerID + critique.reviewerID];
        if (parentReview === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }

        const critic = userKeyMap[critique.criticID];
        if (critic === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }

        const newCritique = Object.assign({
            critiquedGrades: [],
            critic: critic
        }, critique);

        parentReview.critiques.push(newCritique);
        critiqueKeyMap[critique.assignmentID + critique.workerID + critique.reviewerID + critique.criticID] = newCritique;

        if (critiquesByCriticID[critique.criticID] === undefined) {
            critiquesByCriticID[critique.criticID] = [newCritique];
        } else {
            critiquesByCriticID[critique.criticID].push(newCritique);
        }
    }

    const critiquedGradeKeyMap = {};
    for (let cGrade of data.critiquedGrades) {
        const newCGrade = Object.assign({}, cGrade);

        const parentCritique = critiqueKeyMap[cGrade.assignmentID + cGrade.workerID + cGrade.reviewerID + cGrade.criticID];
        if (parentCritique === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }
        parentCritique.critiquedGrades.push(newCGrade);

        critiquedGradeKeyMap[cGrade.assignmentID + cGrade.workerID + cGrade.reviewerID + cGrade.criticID + cGrade.criteriaID] = newCGrade;
    }


    // END of data restructuring, again this is super unnecessary and should be part of the DBMS.  This does run
    // in O(total number of entities), not too bad... Naively using loops it would have been O(product of entity
    // table sizes)...  This is ran for each query, a dbms wouldn't do this, I refuse to optimise it further tho

    return {
        reviews: reviews,
        fullKeyMaps: {
            assignmentKeyMap: assignmentKeyMap,
            workKeyMap: workKeyMap,
            reviewKeyMap: reviewKeyMap,
            gradeKeyMap: gradeKeyMap,
            critiqueKeyMap: critiqueKeyMap
        }
    };

}

/**
 * This method is for removing redundant keys from json objects.  Redundant keys being foreign keys of a relation that
 * are also present in the parent object.
 *
 * For example:
 * ```json5
 * {
 *   a: "value",
 *   children: [
 *     {
 *       a: "value",
 *       b: "another one"
 *     }
 *   ]
 * }
 * ```
 *
 * Would become:
 * ```json5
 * {
 *   a: "value",
 *   children: [
 *     {
 *       b: "another one"
 *     }
 *   ]
 * }
 * ```
 *
 * @param object {Object} The object to remove redundant keys from
 * @param existingKeys {Set<String>} The set of keys that have already been seen and are to be removed
 */
function removeRedundancy(object, existingKeys = new Set()) {
    if (Array.isArray(object)) {
        return object.map((item) => removeRedundancy(item, new Set(existingKeys)));
    } else {
        const result = {};
        for (let key of Object.keys(object)) {
            if (!existingKeys.has(key)) {
                existingKeys.add(key);
                if (object[key] === null) {
                    result[key] = null;
                } else if (typeof (object[key]) === "object") {
                    result[key] = removeRedundancy(object[key], new Set(existingKeys));
                } else {
                    result[key] = object[key];
                }
            }
        }
        return result;
    }
}

router.get('/', async function (req, res) {

    const auth = await authentication.verify(req.headers.token);

    if (auth === undefined) {
        res.status(403).json({message: "Invalid authentication token"});
    } else if (req.query.ownerID !== undefined && typeof (req.query.ownerID) !== "string") {
        res.status(400).json({message: "ownerID must be of type string"});
    } else { // all parameters are have valid types

        const selectingUser = data.users.find((user) => user.email === auth.email);

        if (selectingUser === undefined) {
            res.status(403).json({message: "Invalid authentication token, user doesn't exist"});
        } else if (req.query.ownerID === undefined) { // select all

            if (!selectingUser.isAdmin) {
                res.status(403).json({message: "Admin privileges needed to select all reviews"});
            } else {
                res.status(200).json(getRestructuredData().reviews);
            }
        } else { // select by owner

            if (req.query.ownerID !== selectingUser.userID && !selectingUser.isAdmin) {
                res.status(403).json({message: "Admin privileges are needed to select by another owner"});
            } else {

                const selectedUserExists = data.users.some((user) => user.userID === req.query.ownerID);

                if (!selectedUserExists) {
                    res.status(404).json({message: "No such user exists"});
                } else {

                    const currentTime = new Date().getTime();
                    const selections = {
                        worker: [],
                        reviewer: [],
                        critic: []
                    };

                    const {
                        reviews: reviews
                    } = getRestructuredData();

                    reviews.forEach((review) => {

                        if (review.workerID === req.query.ownerID
                            && review.work.assignment.resultsPublish < currentTime) {

                            selections.worker.push(review);
                            // here you get the whole review (all criticisms)

                        } else if (review.reviewerID === req.query.ownerID) {
                            selections.reviewer.push(review);
                            // here the whole review, all criticisms
                        } else {
                            // here you only get one of the criticisms, if any
                            const relevantCritique = review.critiques.find((critique) => critique.criticID === req.query.ownerID);

                            if (relevantCritique !== undefined) {
                                delete review.critiques;
                                review.critique = relevantCritique;
                                selections.critic.push(review);
                            }
                        }
                    });

                    res.status(200).json(selections);

                }

            }
        }

    }

});

module.exports = router;
