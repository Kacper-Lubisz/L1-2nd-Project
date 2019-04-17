const express = require('express');
const router = express.Router();

const authentication = require("../authentication");
const data = require("../database");

/**
 * This method transforms the data tables from the database into a nested object format (rather arbitrarily chosen
 * relation tree).  The function also returns maps that allow for instant access to each entity if it's keys are known.
 * The goal of this is to make the data easier to work with.
 * @return {{assignments: Array, partialKeyMaps: {workByWorkerID}, fullKeyMaps: {assignmentKeyMap, criteriaKeymap, categoryKeyMap, workKeyMap}}}
 */
function getRestructuredData() {
    const assignments = [];

    const assignmentKeyMap = {};
    for (let assignment of data.assignments) {
        const newAssignment = Object.assign({
            works: [],
            markingCategories: []
        }, assignment);

        assignmentKeyMap[assignment.assignmentID] = newAssignment;
        assignments.push(newAssignment);
    }

    const workKeyMap = {};
    const workByWorkerID = {};
    for (let work of data.work) {
        const newWork = Object.assign({}, work);

        const parentAssignment = assignmentKeyMap[work.assignmentID];
        if (parentAssignment === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }
        parentAssignment.works.push(newWork);

        workKeyMap[work.assignmentID + work.workerID] = newWork;
        if (workByWorkerID[work.workerID] === undefined) {
            workByWorkerID[work.workerID] = [newWork];
        } else {
            workByWorkerID[work.workerID].push(newWork);
        }
    }

    const categoryKeyMap = {};
    for (let category of data.markingCategories) {
        const newCategory = Object.assign({
            markingCriteria: []
        }, category);

        const parentAssignment = assignmentKeyMap[category.assignmentID];
        if (parentAssignment === undefined) {
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }
        parentAssignment.markingCategories.push(newCategory);
        categoryKeyMap[category.assignmentID + category.categoryID] = newCategory;
    }

    const criteriaKeymap = {};
    for (let criteria of data.markingCriteria) {
        const newCriteria = Object.assign({}, criteria);

        const parentCategory = categoryKeyMap[criteria.assignmentID + criteria.categoryID];
        if (parentCategory === undefined) {
            console.log(criteria);
            throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
        }
        parentCategory.markingCriteria.push(newCriteria);
        criteriaKeymap[criteria.assignmentID + criteria.categoryID + criteria.criteriaID] = newCriteria;
    }

    return {
        assignments: assignments,
        fullKeyMaps: {
            assignmentKeyMap: assignmentKeyMap,
            workKeyMap: workKeyMap,
            categoryKeyMap: categoryKeyMap,
            criteriaKeymap: criteriaKeymap
        },
        partialKeyMaps: {
            workByWorkerID: workByWorkerID,
        }
    };
}


router.get('/', async function (req, res, next) {
    res.set("Content-Type", "application/json");

    const auth = await authentication.verify(req.headers.token);

    if (auth === undefined) { // insufficient permissions, no permission
        res.status(403).json({message: "Invalid authentication token"});
    } else if (req.query.assignmentID !== undefined && req.query.workerID !== undefined) {
        res.status(400).json({message: "You can select by assignmentID or ownerID"});
    } else if (req.query.assignmentID !== undefined && typeof req.query.assignment !== "string") {
        res.status(400).json({message: "Type of assignmentID must be string"});
    } else if (req.query.workerID !== undefined && typeof req.query.workerID !== "string") {
        res.status(400).json({message: "Type of ownerID must be string"});
    } else {
        const selectingUser = data.users.find((user) => user.email === auth.email);

        if (selectingUser === undefined) {
            res.status(403).json({message: "Invalid authentication token, user doesn't exist"});
        } else {
            const { // decompose this object to shorten variable names
                assignments: assignments,
                fullKeyMaps: {
                    assignmentKeyMap: assignmentKeyMap,
                    workKeyMap: workKeyMap,
                    categoryKeyMap: categoryKeyMap,
                    criteriaKeymap: criteriaKeymap
                },
                partialKeyMaps: {
                    workByWorkerID: workByWorkerID,
                }
            } = getRestructuredData();

            if (req.query.assignmentID !== undefined) { // select by assignmentID

                const selectedAssignment = assignmentKeyMap[req.query.assignmentID];

                if (selectedAssignment === undefined) {
                    res.status(404).json({message: `No assignment found with assignmentID ${req.query.assignmentID}`});
                } else {
                    if (selectingUser.isAdmin) {
                        res.status(200).json(selectedAssignment);
                    } else {
                        // must check if the selected assignment has a piece of work that the user created
                        const linkingWork = workKeyMap[req.query.assignmentID + selectingUser.userID];
                        // the user could be linked to a piece of work through a review or a critique, this is not what this
                        // end point is for

                        if (linkingWork === undefined) {
                            res.status(403).json({message: "You don't have access to this assignment"});
                        } else {
                            delete selectedAssignment.works;
                            selectedAssignment.work = linkingWork;

                            res.status(200).json(selectedAssignment);
                        }

                    }

                }

            } else if (req.query.workerID !== undefined) { // select all assignments linked to user.

                if (req.query.workerID !== selectingUser.userID && !selectingUser.isAdmin) {
                    res.status(403).json({message: "You can't access this user's assignments"});
                } else {
                    const usersWorks = workByWorkerID[req.query.workerID];
                    const result = [];

                    for (let work of (usersWorks === undefined ? [] : usersWorks)) {
                        const currentAssignment = assignmentKeyMap[work.assignmentID];
                        result.push(currentAssignment);

                        delete currentAssignment.works;
                        currentAssignment.work = work;
                    }

                    res.status(200).json(result);
                }
            } else { // select all assignments

                if (!selectingUser.isAdmin) {
                    res.status(403).json({message: "Admin privileges are needed to access all assignments"});
                } else { // is admin
                    res.status(200).json(assignments);
                }

            }
        }
    }

});

module.exports = router;
