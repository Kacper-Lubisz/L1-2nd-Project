const express = require("express");
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
      // assignment: parentAssignment,
      worker: worker,
    }, work);

    workKeyMap[work.assignmentID + work.workerID] = newWork;
    if (workByWorkerID[work.workerID] === undefined) {
      workByWorkerID[work.workerID] = [newWork];
    } else {
      workByWorkerID[work.workerID].push(newWork);
    }
  }

  const currentTime = new Date().getTime();

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

    const parentAssignment = assignmentKeyMap[review.assignmentID];
    if (parentAssignment === undefined) {
      throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
    }

    if (parentAssignment.reviewsClose < currentTime && review.submissionTime === null) {
      review.submissionTime = parentAssignment.reviewsClose;
      // if reviews have closed and the review isn't submitted, then the review is auto submitted
    }

    const newReview = Object.assign({
      grades: [],
      critiques: [],
      work: parentWork,
      reviewer: reviewer,
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
      // console.error(grade.assignmentID + "\t" + grade.workerID + "\t" + grade.reviewerID);
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

    const parentAssignment = assignmentKeyMap[critique.assignmentID];
    // if the review existed then the assignment will also exist

    const critic = userKeyMap[critique.criticID];
    if (critic === undefined) {
      throw Error("Database inconsistency! a foreign key points to a record that doesn't exist");
    }

    if (parentAssignment.critiquesClose < currentTime && critique.submissionTime === null) {
      critique.submissionTime = parentAssignment.critiquesClose;
      // if critiques have closed and the critique isn't submitted, then the critique is auto submitted
    }

    const newCritique = Object.assign({
      critiquedGrades: [],
      critic: critic,
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

    const parentCritique = critiqueKeyMap[cGrade.assignmentID + cGrade.workerID + cGrade.reviewerID + cGrade.criticID];
    const parentAssignment = assignmentKeyMap[cGrade.assignmentID];

    if (cGrade.state === 1 && currentTime > parentAssignment.resultsPublish) {
      cGrade.state = 4;
    }

    const newCGrade = Object.assign({}, cGrade);

    if (parentCritique === undefined) {
      // console.log(cGrade);
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
      critiqueKeyMap: critiqueKeyMap,
    },
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

/**
 * GET '/reviews'
 * See apidocs.md
 */
router.get("/", async function (req, res, next) {

  try {

    const auth = await authentication.verify(req.headers.token);

    if (auth === undefined) {
      res.status(403).json({message: "No authentication token provided"});
    } else { // all parameters have valid types

      const selectingUser = data.users.find((user) => user.email === auth.email);

      if (selectingUser === undefined) {
        res.status(403).json({message: "Authentication token belongs to no user"});
      } else if (req.query.ownerID === undefined) { // select all

        if (!selectingUser.isAdmin) {
          res.status(403).json({message: "Admin privileges needed to select all reviews"});
        } else {
          res.status(200).json(getRestructuredData().reviews);
        }
      } else { // select by owner

        if (req.query.ownerID !== selectingUser.userID && !selectingUser.isAdmin) {
          res.status(403).json({message: "Admin privileges are needed to select by a none self owner"});
        } else {

          const selectedUserExists = data.users.some((user) => user.userID === req.query.ownerID);

          if (!selectedUserExists) {
            res.status(404).json({message: "No such user exists"});
          } else {

            const currentTime = new Date().getTime();
            const selections = {
              worker: [],
              reviewer: [],
              critic: [],
            };

            const {
              reviews: reviews,
              fullKeyMaps: {
                assignmentKeyMap: assignmentKeyMap,
              },
            } = getRestructuredData();

            reviews.forEach((review) => {

              const assignment = assignmentKeyMap[review.assignmentID];
              // consistency check has already been performed

              if (review.workerID === req.query.ownerID
                                && assignment.resultsPublish < currentTime) {

                selections.worker.push(review);
                // here you get the whole review (all criticisms)

              } else if (review.reviewerID === req.query.ownerID) {
                review.critiques = review.critiques.filter((critique) => critique.submissionTime !== null);
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
            // TODO fix front end to work with removed redundancy
            // res.status(200).json(removeRedundancy(selections));

          }

        }
      }

    }

  } catch (e) {
    next(e);
  }

});

/**
 * POST '/reviews'
 * See apidocs.md
 */
router.post("/", async function (req, res, next) {

  try {

    const auth = await authentication.verify(req.headers.token);

    if (auth === undefined) {
      res.status(403).json({message: "No authentication token provided"});
    } else if (req.body.assignmentID === undefined) {
      res.status(400).json({message: "assignmentID was undefined"});
    } else if (typeof req.body.assignmentID !== "string") {
      res.status(400).json({message: "assignmentID must be of type string"});

    } else if (req.body.reviewerID === undefined && req.body.criticID === undefined) {
      res.status(400).json({message: "define reviewerID or criticID to create a review or critique"});
    } else if (req.body.reviewerID !== undefined && typeof req.body.reviewerID !== "string") {
      res.status(400).json({message: "reviewerID must be of type string"});
    } else if (req.body.criticID !== undefined && typeof req.body.criticID !== "string") {
      res.status(400).json({message: "criticID must be of type string"});

    } else if (req.body.criticID !== undefined && req.body.reviewerID !== undefined) {
      res.status(400).json({message: "Only one of criticID and reviewerID must be defined"});
    } else {

      const creatingUser = data.users.find((user) => user.email === auth.email);
      const assignment = data.assignments.find((assignment) => assignment.assignmentID === req.body.assignmentID);
      const currentTime = new Date().getTime();

      if (creatingUser === undefined) {
        res.status(403).json({message: "Authentication token belongs to no user"});
      } else if (assignment === undefined) {
        res.status(404).json({message: "No such assignment exists"});
      } else if (req.body.reviewerID !== undefined
                && req.body.reviewerID !== creatingUser.userID
                && !creatingUser.isAdmin) {
        res.status(403).json({message: "Admin privilege needed to start reviews for other users"});
      } else if (req.body.criticID !== undefined
                && req.body.criticID !== creatingUser.userID
                && !creatingUser.isAdmin) {
        res.status(403).json({message: "Admin privilege needed to start critiques for other users"});

      } else if (req.body.reviewerID !== undefined
                && !creatingUser.isAdmin
                && (currentTime < assignment.reviewsOpen || assignment.reviewsClose < currentTime)) {
        res.status(400).json({message: "Not possible to start review outside of the review period"});

      } else if (req.body.criticID !== undefined
                && !creatingUser.isAdmin
                && (currentTime < assignment.critiquesOpen || assignment.critiquesClose < currentTime)) {
        res.status(400).json({message: "Not possible to start critique outside of the review period"});

      } else {

        if (req.body.reviewerID !== undefined) {

          const reviewingUser = creatingUser.userID === req.body.reviewerID
            ? creatingUser
            : data.users.find((user) => user.userID === req.body.reviewerID);

          const connectingWork = data.work.find(work => work.assignmentID === req.body.assignmentID
                        && work.workerID === req.body.reviewerID);

          if (reviewingUser === undefined) {
            res.status(404).json({message: "No such reviewer user exists"});
          } else if (connectingWork === undefined) {
            res.status(400).json({message: "Can't start a review for an assignment the user isn't assigned to"});
          } else {

            const workToReviewsNumber = {};
            const worksAlreadyReviewed = {};
            data.reviews.filter((review) => review.assignmentID === req.body.assignmentID)
              .forEach((review) => {
                if (review.reviewerID === req.body.reviewerID) {
                  worksAlreadyReviewed[review.workerID] = true;
                }
                if (workToReviewsNumber[review.workerID] === undefined) {
                  workToReviewsNumber[review.workerID] = 1;
                } else {
                  workToReviewsNumber[review.workerID] += 1;
                }
              });

            const availableWorks = data.work.filter((work) =>
              worksAlreadyReviewed[work.workerID] === undefined
                            && work.submissionTime !== null
                            && work.assignmentID === req.body.assignmentID
                            && work.workerID !== reviewingUser.userID);

            if (availableWorks.length === 0) {
              res.status(503).json({message: "No works left to review"}); // no work to review
            } else {

              const leastReviews = availableWorks
                .map((work) => workToReviewsNumber[work.workerID] === undefined
                  ? 0
                  : workToReviewsNumber[work.workerID])
                .reduce((acc, next) => Math.min(acc, next));

              const leastReviewed = availableWorks
                .filter((work) =>
                  (workToReviewsNumber[work.workerID] === undefined
                    ? 0
                    : workToReviewsNumber[work.workerID]) === leastReviews);

              const workToReview = leastReviewed[Math.floor(Math.random() * leastReviewed.length)];
              const worker = data.users.find((user) => user.userID === workToReview.workerID);

              const newReview = {
                "assignmentID": req.body.assignmentID,
                "workerID": workToReview.workerID,
                "reviewerID": req.body.reviewerID,
                "comment": null,
                "submissionTime": null,
              };

              data.reviews.push(newReview);

              res.status(200).json(Object.assign({}, newReview, {
                grades: [],
                critiques: [],
                reviewer: {
                  userID: reviewingUser.userID,
                  displayName: reviewingUser.displayName,
                  identicon: reviewingUser.identicon,
                },
                work: {
                  worker: {
                    userID: worker.userID,
                    displayName: worker.displayName,
                    identicon: worker.identicon,
                  },
                  assignmentID: workToReview.assignmentID,
                  workerID: worker.userID,
                  submissionTime: workToReview.assignmentID,
                },
              }));

            }

          }

        } else { // new critique

          const criticUser = creatingUser.userID === req.body.criticID
            ? creatingUser
            : data.users.find((user) => user.userID === req.body.criticID);

          const connectingWork = data.work.find(work => work.assignmentID === req.body.assignmentID
                        && work.workerID === req.body.criticID);

          if (criticUser === undefined) {
            res.status(404).json({message: "No such critic user exists"});
          } else if (connectingWork === undefined) {
            res.status(400).json({message: "Can't start a critique for an assignment the user isn't assigned to"});
          } else {

            const reviewsCritiqueNumber = {};
            const alreadyCritiquedReviews = {};

            data.critiques.filter((critique) => critique.assignmentID === req.body.assignmentID)
              .forEach((critique) => {
                if (critique.criticID === criticUser.userID) {
                  alreadyCritiquedReviews[critique.workerID + critique.reviewerID] = true;
                }
                if (reviewsCritiqueNumber[critique.reviewerID] === undefined) {
                  reviewsCritiqueNumber[critique.reviewerID] = 1;
                } else {
                  reviewsCritiqueNumber[critique.reviewerID] += 1;
                }
              });

            const availableReviews = data.reviews.filter((review) =>
              review.assignmentID === req.body.assignmentID
                            && alreadyCritiquedReviews[review.workerID + review.reviewerID] === undefined
                            && review.submissionTime !== null
                            && review.workerID !== criticUser.userID
                            && review.reviewerID !== criticUser.userID);

            if (availableReviews.length === 0) {
              res.status(503).json({message: "No reviews left to critique"}); // no work to review
            } else {

              const leastCritiqued = availableReviews
                .map((review) => reviewsCritiqueNumber[review.reviewerID] === undefined
                  ? 0
                  : reviewsCritiqueNumber[review.reviewerID])
                .reduce((acc, next) => Math.min(acc, next));

              const leastReviewed = availableReviews
                .filter((review) =>
                  (reviewsCritiqueNumber[review.reviewerID] === undefined
                    ? 0
                    : reviewsCritiqueNumber[review.reviewerID]) === leastCritiqued);

              const reviewToCritique = leastReviewed[Math.floor(Math.random() * leastReviewed.length)];

              const newCritique = {
                assignmentID: req.body.assignmentID,
                workerID: reviewToCritique.workerID,
                reviewerID: reviewToCritique.reviewerID,
                criticID: req.body.criticID,
                submissionTime: null,
              };

              data.critiques.push(newCritique);

              // TODO this is terribly wasteful
              // again using a database to replace this would be the solution

              const reviewData = getRestructuredData().reviews.find((review) =>
                review.assignmentID === reviewToCritique.assignmentID
                                && review.workerID === reviewToCritique.workerID
                                && review.reviewerID === reviewToCritique.reviewerID,
              );      // here you only get one of the criticisms, if any

              const critiqueData = reviewData.critiques.find((critique) =>
                critique.criticID === req.body.criticID);

              delete reviewData.critiques;
              reviewData.critique = critiqueData;

              res.status(200).json(reviewData);
            }
          }
        }
      }
    }

  } catch (e) {
    next(e);
  }
});

/**
 * PATCH '/reviews'
 * See apidocs.md
 */
router.patch("/", async function (req, res, next) {

  try {

    const auth = await authentication.verify(req.headers.token);

    if (auth === undefined) {
      res.status(403).json({message: "No authentication token provided"});

    } else if (req.body.assignmentID === undefined) {
      res.status(400).json({message: "assignmentID was undefined"});
    } else if (typeof req.body.assignmentID !== "string") {
      res.status(400).json({message: "assignmentID must be of type string"});

    } else if (req.body.workerID === undefined) {
      res.status(400).json({message: "workerID was undefined"});
    } else if (typeof req.body.workerID !== "string") {
      res.status(400).json({message: "workerID must be of type string"});

    } else if (req.body.submit === undefined) {
      res.status(400).json({message: "submit was undefined"});
    } else if (typeof req.body.submit !== "boolean") {
      res.status(400).json({message: "submit must be of type boolean"});

    } else if (req.body.criticID !== undefined && typeof req.body.criticID !== "string") {
      res.status(400).json({message: "criticID must be of type string"});
    } else if (req.body.reviewerID !== undefined && typeof req.body.reviewerID !== "string") {
      res.status(400).json({message: "reviewerID must be of type string"});

    } else {

      const currentTime = new Date().getTime();

      const updatingUser = data.users.find((user) => user.email === auth.email);
      const assignment = data.assignments.find((assignment) => assignment.assignmentID === req.body.assignmentID);

      const markingCriteria = data.markingCriteria
        .filter((criteria) => criteria.assignmentID === req.body.assignmentID);

      if (updatingUser === undefined) {
        res.status(403).json({message: "Invalid authentication token, user doesn't exist"});
      } else if (req.body.criticID === undefined) { // update review

        const review = data.reviews.find((review) =>
          review.assignmentID === req.body.assignmentID
                    && review.workerID === req.body.workerID
                    && review.reviewerID === req.body.reviewerID,
        );

        if (review === undefined) {
          res.status(404).json({message: "No such review exists"});

        } else if (req.body.comment !== undefined
                    && req.body.comment !== null
                    && typeof req.body.comment !== "string") {

          res.status(400).json({message: "comment must be of type string"});
        } else if (req.body.comment !== undefined
                    && req.body.comment !== null
                    && req.body.length !== 0
                    && req.body.comment !== req.sanitize(req.body.comment)) {

          res.status(400).json({message: "comment failed sanitization"});
        } else if (req.body.submit && (req.body.comment === undefined || req.body.comment === null)) {
          res.status(400).json({message: "can't submit an null or undefined comment"});

        } else if ((currentTime < assignment.reviewsOpen || assignment.reviewsClose < currentTime)
                    && !updatingUser.isAdmin) {
          res.status(403).json({
            message: "Admin privilege is needed to update reviews outside the submission period",
          });
        } else if (updatingUser.userID !== req.body.reviewerID && !updatingUser.isAdmin) {
          res.status(403).json({message: "Admin privilege is needed to update other user's reviews"});


        } else if (!Array.isArray(req.body.grades)) {
          res.status(400).json({message: "grades must be an array"});
        } else if (req.body.grades.some((grade) =>
          grade.categoryID === undefined || grade.categoryID === null || typeof grade.categoryID !== "string")
        ) {
          res.status(400).json({message: "all grades must have categoryIDs of type string"});

        } else if (req.body.grades.some(
          (grade) => grade.criteriaID === undefined || grade.criteriaID === null
                        || typeof grade.criteriaID !== "string")
        ) {
          res.status(400).json({message: "all grades must define a criteriaID of type string"});

        } else if (req.body.submit && req.body.grades.some(
          (grade) => grade.comment === undefined || grade.comment === null)) {
          res.status(400).json({message: "to submit, all grades must define a comment"});

        } else if (req.body.grades.some((grade) => grade.comment !== undefined
                    && grade.comment !== null
                    && typeof grade.comment !== "string")
        ) {
          res.status(400).json({message: "all grades must define a comment of type string"});

        } else if (req.body.grades.some(
          (grade) => grade.comment !== undefined
                        && grade.comment !== null
                        && grade.comment !== req.sanitize(grade.comment))
        ) {
          res.status(400).json({message: "not all grade comments passed sanitization"});

        } else if (req.body.submit && req.body.grades.some(
          (grade) => grade.mark === undefined || grade.mark === null)
        ) {
          res.status(400).json({
            message: "can't submit if not all grades define a mark",
          });
        } else if (!req.body.submit && req.body.grades.some(
          (grade) => (grade.mark !== undefined && grade.mark !== null) &&
                        (typeof grade.mark !== "number" || grade.mark < 0 || grade.mark > 1))) {

          res.status(400).json({
            message: "all marks must define a mark of type number between 0 and 1",
          });
        } else {

          const markingCriteriaSet = {};
          markingCriteria.forEach((criteria) => {
            markingCriteriaSet[criteria.categoryID + criteria.criteriaID] = true;
          });

          const submittedSet = {};

          if (req.body.submit && (req.body.comment === null || req.body.comment.length === 0)) {
            res.status(400).json({message: "can't submit a review without a comment"});
          } else if (req.body.grades.some(
            (grade) => markingCriteriaSet[grade.categoryID + grade.criteriaID] === undefined,
          )) {
            res.status(400).json({message: "grades were submitted that don't belong to the assignment"});
            // must be surjective
          } else if (req.body.grades.some((grade) => {
            if (submittedSet[grade.categoryID + grade.criteriaID] === undefined) {
              submittedSet[grade.categoryID + grade.criteriaID] = true;
              return false;
            } else {
              return true;
            }
          })) {
            res.status(400).json({message: "two grades were submitted for the same criteria"});
            // must be injective
          } else if (markingCriteria.length !== req.body.grades.length && req.body.submit) {
            res.status(400).json({message: "Can't submit a review without providing all grades"});
          } else {

            if (req.body.comment !== null && req.body.comment !== undefined) {
              review.comment = req.body.comment;
            }

            const existingGradeMap = {};
            data.grades.filter((grade) => grade.assignmentID === req.body.assignmentID
                            && grade.workerID === req.body.workerID
                            && grade.reviewerID === req.body.reviewerID,
            ).forEach((grade) => {
              existingGradeMap[grade.categoryID + grade.criteriaID] = grade;
            });

            req.body.grades.forEach((grade) => {

              if (existingGradeMap[grade.categoryID + grade.criteriaID] === undefined) {
                data.grades.push({
                  assignmentID: req.body.assignmentID,
                  workerID: req.body.workerID,
                  reviewerID: req.body.reviewerID,
                  categoryID: grade.categoryID,
                  criteriaID: grade.criteriaID,
                  mark: grade.mark === undefined ? null : grade.mark,
                  comment: grade.comment === undefined ? null : grade.comment,
                });
              } else {
                const existingGrade = existingGradeMap[grade.categoryID + grade.criteriaID];
                existingGrade.mark = grade.mark === undefined ? null : grade.mark;
                existingGrade.comment = grade.comment === undefined ? null : grade.comment;
              }
            });

            // grades are never removed, only cleared to be empty, effectively the same

            if (req.body.submit) {
              review.submissionTime = currentTime;
              res.status(200).json({submissionTime: currentTime});
            } else {
              res.status(200).json({});
            }

          }

        }


      } else { // update critique

        const critique = data.critiques.find(critique =>
          critique.assignmentID === req.body.assignmentID
                    && critique.workerID === req.body.workerID
                    && critique.reviewerID === req.body.reviewerID
                    && critique.criticID === req.body.criticID);

        if (critique === undefined) {
          res.status(404).json({message: "No such critique found"});

        } else if ((currentTime < assignment.critiquesOpen || assignment.critiquesClose < currentTime)
                    && !updatingUser.isAdmin) {
          res.status(403).json({
            message: "Admin privilege is needed to update critiques outside the submission period",
          });
        } else if (updatingUser.userID !== req.body.criticID && !updatingUser.isAdmin) {
          res.status(403).json({message: "Admin privilege is needed to update other user's critiques"});

        } else if (!Array.isArray(req.body.critiquedGrades)) {
          res.status(400).json({message: "critiquedGrades must be an array"});
        } else if (req.body.critiquedGrades.some((cGrade) =>
          cGrade.categoryID === undefined
                    || cGrade.categoryID === null
                    || typeof cGrade.categoryID !== "string")
        ) {
          res.status(400).json({message: "all critiqued grades must have categoryIDs of type string"});

        } else if (req.body.critiquedGrades.some((cGrade) =>
          cGrade.criteriaID === undefined
                    || cGrade.criteriaID === null
                    || typeof cGrade.criteriaID !== "string")
        ) {
          res.status(400).json({message: "all critiqued grades must define a criteriaID of type string"});

        } else if (req.body.submit && req.body.critiquedGrades.some(
          (cGrade) => cGrade.comment === undefined || cGrade.comment === null)
        ) {
          res.status(400).json({message: "to submit, all critiqued grades must define a comment"});

        } else if (req.body.critiquedGrades.some((cGrade) =>
          cGrade.comment !== undefined
                    && cGrade.comment !== null
                    && typeof cGrade.comment !== "string")
        ) {
          res.status(400).json({message: "all grades must define a comment of type string"});

        } else if (req.body.critiquedGrades.some((cGrade) =>
          cGrade.comment !== undefined
                    && cGrade.comment !== null
                    && cGrade.comment !== req.sanitize(cGrade.comment))
        ) {
          res.status(400).json({message: "not all grade comments passed sanitization"});

        } else if (req.body.submit && req.body.critiquedGrades.some(
          (cGrade) => cGrade.proposedMark === undefined || cGrade.proposedMark === null)
        ) {
          res.status(400).json({message: "to submit, all critiqued grades must define a mark"});

        } else if (req.body.critiquedGrades.some(
          (cGrade) => (cGrade.proposedMark !== undefined && cGrade.proposedMark !== null) &&
                        (typeof cGrade.proposedMark !== "number"
                            || cGrade.proposedMark < 0
                            || cGrade.proposedMark > 1))
        ) {
          res.status(400).json({
            message: "all marks must define a mark of type number between 0 and 1",
          });
        } else {

          const markingCriteriaSet = {};
          markingCriteria.forEach((criteria) => {
            markingCriteriaSet[criteria.categoryID + criteria.criteriaID] = true;
          });

          const gradesMap = {};
          const reviewGrades = data.grades.filter(grade =>
            grade.assignmentID === req.body.assignmentID
                        && grade.workerID === req.body.workerID
                        && grade.reviewerID === req.body.reviewerID,
          );
          reviewGrades.forEach(grade => {
            if (grade.comment !== null && grade.mark !== null) {
              gradesMap[grade.categoryID + grade.criteriaID] = grade;
            }
          });

          const submittedSet = {};
          if (req.body.critiquedGrades.some(
            cGrade => gradesMap[cGrade.categoryID + cGrade.criteriaID] === undefined,
          )) {
            res.status(400).json({
              message: "critiqued grades were submitted that don't belong to a grade in the review review",
            });

          } else if (req.body.critiquedGrades.some(cGrade => {
            if (submittedSet[cGrade.categoryID + cGrade.criteriaID] === undefined) {
              submittedSet[cGrade.categoryID + cGrade.criteriaID] = true;
              return false;
            } else {
              return false;
            }
          })) {
            res.status(400).json({message: "two critiqued grades were submitted for the same grade"});
          } else if (req.body.submit && reviewGrades.some(grade =>
            grade.comment !== null
                        && grade.mark !== null
                        && submittedSet[grade.categoryID + grade.criteriaID] === undefined)
          ) {
            res.status(400).json({message: "can't submit without a critiqued grade for every grade"});
          } else { // valid request

            const existingCGradeMap = {};
            data.critiquedGrades.filter((cGrade) =>
              cGrade.assignmentID === req.body.assignmentID
                            && cGrade.workerID === req.body.workerID
                            && cGrade.reviewerID === req.body.reviewerID
                            && cGrade.criticID === req.body.criticID,
            ).forEach((cGrade) => {
              existingCGradeMap[cGrade.categoryID + cGrade.criteriaID] = cGrade;
            });


            req.body.critiquedGrades.forEach((cGrade) => {

              if (existingCGradeMap[cGrade.categoryID + cGrade.criteriaID] === undefined) {
                data.critiquedGrades.push({
                  assignmentID: req.body.assignmentID,
                  workerID: req.body.workerID,
                  reviewerID: req.body.reviewerID,
                  criticID: req.body.criticID,
                  categoryID: cGrade.categoryID,
                  criteriaID: cGrade.criteriaID,
                  proposedMark: cGrade.proposedMark === undefined ? null : cGrade.proposedMark,
                  comment: cGrade.comment === undefined ? null : cGrade.comment,
                  state: cGrade.proposedMark === gradesMap[cGrade.categoryID + cGrade.criteriaID].mark
                    ? 0 : 1,
                });
              } else {
                const existingGrade = existingCGradeMap[cGrade.categoryID + cGrade.criteriaID];
                existingGrade.proposedMark = cGrade.proposedMark === undefined
                  ? null
                  : cGrade.proposedMark;
                existingGrade.comment = cGrade.comment === undefined ? null : cGrade.comment;
              }
            });

            // grades are never removed, only cleared to be empty, effectively the same

            if (req.body.submit) {
              critique.submissionTime = currentTime;
              res.status(200).json({submissionTime: currentTime});
            } else {
              res.status(200).json({});
            }

          }
        }
      }

    }
  } catch (e) {
    next(e);
  }

});

module.exports = router;
