const _ = require("lodash");

const rawData = require("./config/data.json");

// module variables
const defaultData = rawData.production;
const environmentData = rawData[process.env.NODE_ENV === "test"
  ? "development"
  : (process.env.NODE_ENV || "production")];
const data = _.merge(defaultData, environmentData);

// TODO add data integrity checks to help peer reviewers
// including duplicate entries and reference checks

// The code below could have been done in one line
// module.export = finalData
// but this wouldn't have associated the type data
// this is better for any developer using modern dev tools (taking advantage of type inference)

/**
 * A user's data
 * @typedef {Object} User
 * @property {string} userID - The primary key, a random string
 * @property {string} email - The user email
 * @property {string} displayName - The user's display name
 * @property {string} identicon - The URL to the user's identicon
 * @property {boolean} isAdmin - If said user is an admin
 */

/**
 * The list of users
 * @type User[]
 */
module.exports.users = data.users;

/**
 * This callback is used for searching through all users.
 * @callback UserPredicate
 * @param {User} user The user that is to be predicated
 * @return {boolean} the return value
 */

/**
 * A piece of work that is to be reviewed
 * @typedef {Object} Work
 * @property {string} assignmentID - The assignment it is part of
 * @property {string} workerID - the id of the user that this work was made by
 * @property {number|null} submissionTime - the time at which the work was submitted, null if not submitted
 */

/**
 * The list of pieces of work
 * @type Work[]
 */
module.exports.work = data.work;

/**
 * This represents an assignment
 * @typedef {Object} Assignment
 * @property {string} assignmentID - The assignment's primary key
 * @property {string} title - the name of the assignment that will identify it to the users
 * @property {string} description - The description of the assignment
 * @property {string} blurb - A shorter description of the assignment
 * @property {number} submissionOpen - the unix time stamp at which the submissions open
 * @property {number} submissionClose - the unix time stamp at which the submissions close
 * @property {number} reviewsOpen - the unix time stamp at which the reviews open
 * @property {number} reviewsClose - the unix time stamp at which the reviews close
 * @property {number} critiquesOpen - the unix time stamp at which the critiques open
 * @property {number} critiquesClose - the unix time stamp at which the critiques close
 * @property {number} resultsPublish - the unix time stamp at which results are published
 * @property {number} minReviews - the number of reviews that yields 100% for reviews
 * @property {number} minCritiques - the number of critiques that yields 100% for critiques
 */

/**
 * The list of assignments
 * @type Assignment[]
 */
module.exports.assignments = data.assignments;

/**
 * This represents one marking category for an assignment
 * @typedef {Object} MarkingCategory
 * @property {string} assignmentID - The assignment it's for
 * @property {string} categoryID - The unique part of the composite key
 * @property {string} title - the name which identifies the marking criteria
 * @property {string} description - the text description of the purpose category
 * @property {number} weight - how much this category is worth
 */

/**
 * The list of marking categories
 * @type MarkingCategory[]
 */
module.exports.markingCategories = data.markingCategories;


/**
 * This represents one marking criteria for an category, a sub category of sorts.
 * @typedef {Object} MarkingCriteria
 * @property {string} assignmentID - The assignment it's for
 * @property {string} categoryID - The marking category it is part of
 * @property {string} criteriaID - The unique part of the composite key
 * @property {number} weight - how much this sub-category is worth
 * @property {string} subtitle - the name which identifies the marking criteria
 * @property {string} description - A description to guide the marking for this criteria
 */

/**
 * The list of marking criteria
 * @type MarkingCriteria[]
 */
module.exports.markingCriteria = data.markingCriteria;

/**
 * This represents each review made by a user
 * @typedef {Object} Review
 * @property {string} assignmentID - part of composite foreign key to identify a piece of work
 * @property {string} workerID - part of composite foreign key to identify a piece of work
 * @property {string} reviewerID - the id user who wrote this review
 * @property {string|null} comment - the feedback left by the reviewer
 * @property {number|null} submissionTime - the unix timestamp of the submission time, otherwise null
 */

/**
 * The list of reviews
 * @type Review[]
 */
module.exports.reviews = data.reviews;

/**
 * This represents a mark that is given for a singular marking sub category
 * @typedef {Object} Grade
 * @property {string} assignmentID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} workerID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} reviewerID - the id of the user that left this review
 * @property {string} categoryID - The category that this grade is given for
 * @property {string} criteriaID - The criteria that this grade is given for
 * @property {number} mark - The mark that is given for that marking criteria
 * @property {string} comment - The reasoning for the given grade
 */


/**
 * The list of grades
 * @type Grade[]
 */
module.exports.grades = data.grades;

/**
 * This represents a critique of a grade that was given
 * @typedef {Object} Critique
 * @property {string} assignmentID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} workerID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} reviewerID - the id of review the critique is of
 * @property {string} criticID - the id of the user that left this critique
 * @property {number|null} submissionTime - the unix timestamp of the submission time, otherwise null
 */

/**
 * The list of critique
 * @type Critique[]
 */
module.exports.critiques = data.critiques;

/**
 * This represents a critique of a grade that was given
 * @typedef {Object} CritiquedGrade
 * @property {string} assignmentID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} workerID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} reviewerID - the id of review the critique is of
 * @property {string} criticID - the id of the user that left this critique
 * @property {string} categoryID - The category that is being contradicted
 * @property {string} criteriaID - The criteria that is being contradicted
 * @property {number} proposedMark - The mark that the critic thinks is more appropriate
 * @property {string} comment - The reasoning for why the critique is valid
 * @property {number} state - state of the critique 0 - Agreeing, 1 - Submitted, 2 - Accepted, 3 - Rejected,
 * 4 - Auto-Rejected
 */

/**
 * The list of critique
 * @type CritiquedGrade[]
 */
module.exports.critiquedGrades = data.critiquedGrades;
