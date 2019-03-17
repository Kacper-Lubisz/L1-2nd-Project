const _ = require('lodash');

const data = require('./config/data.json');

// module variables
const defaultData = data.production;
const environmentData = data[process.env.NODE_ENV || 'production'];
const finalData = _.merge(defaultData, environmentData);

// The code below could have been done in one line
// module.export = finalData
// but this wouldn't have associated the type data
// this is better for any developer using modern dev tools (taking advantage of type inference)

/**
 * A user's data
 * @typedef {Object} User
 * @property {string} userID - The primary key, a random string
 * @property {string} username - The username
 * @property {string} displayName - The user's displayname
 * @property {string} password - The hashed password
 * @property {string} salt - The salt used for the hash
 * @property {boolean} isAdmin - If said user is an admin
 */

/**
 * The list of users
 * @type User[]
 */
module.exports.users = finalData.users;


/**
 * A piece of work that is to be reviewed
 * @typedef {Object} Work
 * @property {string} assignmentID - The assignment it is part of
 * @property {string} userID - the id of the user that this work belongs to
 * @property {string} localUrl - the url to where the server is storing this piece of work
 */

/**
 * The list of pieces of work
 * @type Work[]
 */
module.exports.work = finalData.work;


/**
 * This represents an assignment
 * @typedef {Object} Assignment
 * @property {string} assignmentID - The assignment's primary key
 * @property {string} title - the name of the assignment that will identify it to the users
 * @property {string} workUrl - The url where the server stores all the work for this assignment
 */

/**
 * The list of assignments
 * @type Assignment[]
 */
module.exports.assignments = finalData.assignments;


/**
 * This represents one marking category for an assignment
 * @typedef {Object} MarkingCategory
 * @property {string} categoryID - The primary key
 * @property {string} assignmentID - The assignment it's for
 * @property {string} title - the name which identifies the marking criteria
 * @property {number} weight - how much this category is worth
 */

/**
 * The list of marking categories
 * @type MarkingCategory[]
 */
module.exports.markingCategories = finalData.markingCategories;


/**
 * This represents one marking criteria for an category, a sub category of sorts.
 * @typedef {Object} MarkingCriteria
 * @property {string} criteriaID - The primary key
 * @property {string} categoryID - The marking category it is part of
 * @property {number} weight - how much this sub-category is worth
 * @property {string} subtitle - the name which identifies the marking criteria
 * @property {string} description - A description to help a user understand what this criteria is
 */

/**
 * The list of marking criteria
 * @type MarkingCriteria[]
 */
module.exports.markingCriteria = finalData.markingCriteria;

/**
 * This represents each review made by a user
 * @typedef {Object} Review
 * @property {string} assignmentID - part of composite foreign key to identify a piece of work
 * @property {string} userID - part of composite foreign key to identify a piece of work
 * @property {string} reviewerID - the id user who wrote this review
 * @property {string} comment - the feedback left by the reviewer
 * @property {boolean} isComplete - if the review is completed and ready to be critiqued
 */

/**
 * The list of reviews
 * @type Review[]
 */
module.exports.reviews = finalData.reviews;

/**
 * This represents a mark that is given for a singular marking sub category
 * @typedef {Object} Grade
 * @property {string} assignmentID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} ownerID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} reviewerID - the id of the user that left this review
 * @property {string} criteriaID - The criteria that this grade is given for
 * @property {number} mark - The mark that is given for that marking criteria
 * @property {string} comment - The reasoning for the given grade
 */

/**
 * The list of grades
 * @type Grade[]
 */
module.exports.grades = finalData.grades;

/**
 * This represents a critique of a grade that was given
 * @typedef {Object} Critique
 * @property {string} assignmentID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} ownerID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} criticID - the id of the user that left this critique
 * @property {string} criteriaID - The criteria that is being contradicted
 * @property {number} proposedMark - The mark that the critic thinks is more appropriate
 * @property {string} comment - The reasoning for why the critique is valid
 * @property {number} state - state of the critique 0 - Agreeing, 1 - Submitted, 2 - Accepted, 3 - Rejected
 */

/**
 * The list of critique
 * @type Critique[]
 */
module.exports.critiques = finalData.critiques;