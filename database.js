const _ = require('lodash');

const rawData = require('./config/data.json');

// module variables
const defaultData = rawData.production;
const environmentData = rawData[process.env.NODE_ENV || 'production'];
const data = _.merge(defaultData, environmentData);

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
 * Deletes one user from the database
 * @param predicate {UserPredicate} The selector for the user
 * @return {User|undefined} The user that was deleted, or undefined if no user was found
 */
module.exports.deleteUserByPredicate = function (predicate) {

    // if this system were to be used this would be replaced with a database call
    for (let i = 0; i < data.users.length; i++) {
        if (predicate(data.users[i])) {
            const deletedUser = data.users[i];
            data.users.splice(i, 1); // not returning this for type hint reasons
            return deletedUser;
        }
    }
    return undefined;
};

/**
 * Adds a new user to the database.  **This function doesn't check if a user with the same username or userID exists**
 * @param user {User} The user to be added
 */
module.exports.addUser = function (user) {
    data.users.push(user);
    throw Error("not implemented error");
};

/**
 * A piece of work that is to be reviewed
 * @typedef {Object} Work
 * @property {string} assignmentID - The assignment it is part of
 * @property {string} workerID - the id of the user that this work was made by
 * @property {string} localUrl - the url to where the server is storing this piece of work
 * @property {number} submissionTime - the time at which the work was submitted, null if not submitted
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
 * @property {string} workUrl - The url where the server stores all the work for this assignment
 * @property {string} blurb - The description of the assignment
 * @property {number} submissionOpen - the unix time stamp at which the submissions open
 * @property {number} submissionClose - the unix time stamp at which the submissions close
 * @property {number} reviewsOpen - the unix time stamp at which the reviews open
 * @property {number} reviewsClose - the unix time stamp at which the reviews close
 * @property {number} critiquesOpen - the unix time stamp at which the critiques open
 * @property {number} critiquesClose - the unix time stamp at which the critiques close
 * @property {number} resultsPublish - the unix time stamp at which results are published
 *
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
 * @property {string} description - A description to help a user understand what this criteria is
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
 * @property {string} comment - the feedback left by the reviewer
 * @property {boolean} isComplete - if the review is completed and ready to be critiqued
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
 * @property {string} comment - The reasoning for why the critique is valid
 * @property {boolean} isComplete - If the critique is complete
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
 * @property {string} criteriaID - The criteria that is being contradicted
 * @property {number} proposedMark - The mark that the critic thinks is more appropriate
 * @property {string} comment - The reasoning for why the critique is valid
 * @property {boolean} isComplete - If the critique is complete
 * @property {number} state - state of the critique 0 - Agreeing, 1 - Submitted, 2 - Accepted, 3 - Rejected
 */

/**
 * The list of critique
 * @type CritiquedGrade[]
 */
module.exports.critiquedGrades = data.critiquedGrades;
