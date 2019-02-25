
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
module.exports.users = [
    {	
		userID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
        username: "admin",
		displayName: "Adjective Noun",
		displayIcon: "icons/001.png",
        salt: "high salt levels",
        password: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b", // the password is admin
        isAdmin: true
    }
];


/**
 * A piece of work that is to be reviewed
 * @typedef {Object} Work
 * @property {int} assignmentID - The assignment it is part of
 * @property {string} userID - the id of the user that this work belongs to
 * @property {string} localUrl - the url to where the server is storing this piece of work
 */

/**
 * The list of pieces of work
 * @type Work[]
 */
module.exports.work = [
    {
		assignmentID: "5FB2054478353FD8D514056D1745B3A9EEF066DEADDA4B90967AF7CA65CE6505"
		userID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		localUrl: "/work/assignment_0/651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b"
    }
];


/**
 * This represents an assignment
 * @typedef {Object} Assignment
 * @property {int} assignmentID - The assignment's primary key
 * @property {string} title - the name of the assignment that will identify it to the users
 * @property {string} workUrl - The url where the server stores all the work for this assignment 
 */

/**
 * The list of assignments
 * @type Assignment[]
 */
module.exports.assignments = [
    {
		assignmentID: "5FB2054478353FD8D514056D1745B3A9EEF066DEADDA4B90967AF7CA65CE6505",
		title: "Programming Summative"
		workUrl: "/work/assignment_0"
    }
];

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
module.exports.markingCategorys = [
    {
		categoryID: "C8394D5B9C00E3A5FACA904016CEAD7864E6E6F02E5A42C99152BB50DFB4A268",
		assignmentID: "5FB2054478353FD8D514056D1745B3A9EEF066DEADDA4B90967AF7CA65CE6505",
		title: "Code Quality"
		weight: 1
    }
];

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
 * The list of markign criterias
 * @type MarkingCriteria[]
 */
module.exports.markingCriteria = [
    {
		criteriaID: "04A7693C82490B9D79E528F4499EAAF3B16AE1E095D082B2319099ECD3E8DE97",
		categoryID: "C8394D5B9C00E3A5FACA904016CEAD7864E6E6F02E5A42C99152BB50DFB4A268",
		weight: 1,
		subtitle: "ESLint",
		description: "This criteria is about how well the code does in ESLint."
    }
];


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
module.exports.reviews = [
    {
		assignmentID: "5FB2054478353FD8D514056D1745B3A9EEF066DEADDA4B90967AF7CA65CE6505",
		userID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		reviwerID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		comment: "generally poor, do more work",
		isComplete: true
    }
];

/**
 * This represents a mark that is given for a singular marking sub category
 * @typedef {Object} Grade
 * @property {string} assignmentID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} ownerID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} reviwerID - the id of the user that left this review
 * @property {string} criteriaID - The criteria that this grade is given for
 * @property {number} mark - The mark that is given for that marking criteria
 * @property {string} comment - The reasoning for the given grade
 */

/**
 * The list of grades
 * @type Grade[]
 */
module.exports.grades = [
    {
		assignmentID: "5FB2054478353FD8D514056D1745B3A9EEF066DEADDA4B90967AF7CA65CE6505"
		ownerID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		reviwerID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		criteriaID: "04A7693C82490B9D79E528F4499EAAF3B16AE1E095D082B2319099ECD3E8DE97",
		mark: .20,
		comment: "legit 20 serious warnings and 100 minor ones, no effort"
    }
];


/**
 * This represents a critique of a grade that was given
 * @typedef {Object} Critique
 * @property {string} assignmentID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} ownerID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} reviwerID - the id of the user that left this review
 * @property {string} criteriaID - The criteria that this grade is given for
 * @property {number} mark - The mark that is given for that marking criteria
 * @property {string} comment - The reasoning for the given grade
 */

/**
 * The list of grades
 * @type Grade[]
 */
module.exports.grades = [
    {
		assignmentID: "5FB2054478353FD8D514056D1745B3A9EEF066DEADDA4B90967AF7CA65CE6505"
		ownerID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		reviwerID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		criteriaID: "04A7693C82490B9D79E528F4499EAAF3B16AE1E095D082B2319099ECD3E8DE97",
		mark: .20,
		comment: "legit 20 serious warnings and 100 minor ones, no effort"
    }
];


/**
 * This represents a critique of a grade that was given
 * @typedef {Object} Critique
 * @property {string} assignmentID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} ownerID - part of the composite key to identify the piece of work that this grade is for
 * @property {string} criticID - the id of the user that left this critique
 * @property {string} criteriaID - The criteria that is being contradicted
 * @property {number} proposedMark - The mark that the critic thinks is more appropiate
 * @property {string} comment - The reasoning for why the critique is valid
 * @property {int} state - state of the critique 0 - Agreeing, 1 - Submitted
 */

/**
 * The list of critique
 * @type Critique[]
 */
module.exports.critique = [
    {
		assignmentID: "5FB2054478353FD8D514056D1745B3A9EEF066DEADDA4B90967AF7CA65CE6505"
		ownerID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		reviwerID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
		criteriaID: "04A7693C82490B9D79E528F4499EAAF3B16AE1E095D082B2319099ECD3E8DE97",
		mark: .0,
		comment: "with all those warnings he diserves nothing, no effort!"
		state: 1
    }
];