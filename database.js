
/**
 * A user's data
 * @typedef {Object} User
 * @property {string} username - The username
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
        username: "admin",
        salt: "high salt levels",
        password: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b", // the password is admin
        isAdmin: true
    }
];