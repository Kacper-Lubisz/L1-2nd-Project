const express = require('express');
const crypto = require('crypto');

const PNGImage = require('pngjs-image');
const fs = require('fs');

const authentication = require("../authentication");
const config = require("../config/config");

const data = require("../database");

const router = express.Router();

/**
 * This function returns a random string which is to be used as the display name of users.  The names are inspired by
 * 'operation' names.
 * @return {string} The display name
 */
function generateDisplayName() {
    // TODO replace this with an API call to have random words served
    return config.displayNames.first[Math.floor(Math.random() * config.displayNames.first.length)]
        + config.displayNames.second[Math.floor(Math.random() * config.displayNames.second.length)];
}

/**
 * This function is for generating the icons that appear next to users.  In the current state it just generates an image
 * which is just one color (but this can of course be improved simply through the means of this abstraction!).
 * @return {string} The URL to the icon that has been generated.
 */
function generateDisplayIcon() {
    // TODO improve this so that the icons are more than just a color

    /**
     * Local function for converting the hex representation of a color to the json format that pngjs-image expects.
     * @param color The hex representation of the color e.g. '#ff0000'
     * @return {{red: number, green: number, blue: number}} The json representation of the color
     */
    function hexToJson(color) {

        let newVar = {
            red: parseInt(color.substr(1, 2), 16),
            green: parseInt(color.substr(3, 2), 16),
            blue: parseInt(color.substr(5, 2), 16),
            alpha: 255
        };
        console.log(color, newVar);
        return newVar;
    }

    const color = config.displayNames.colors[Math.floor(Math.random() * config.displayNames.colors.length)];
    let iconPath = "public/icons/" + color.substr(1) + ".png";
    // the # isn't stored, it is redundant and would require special encoding since it isn't safe in a URL

    if (!fs.existsSync(iconPath)) { // doesn't need recomputing if it already exists

        const image = PNGImage.createImage(1, 1);
        image.setAt(0, 0, hexToJson(color));
        try {
            image.writeImageSync(iconPath);
            // This could imaginably error out if the server runs out of storage or something alike, in this case it is
            // still safe to return a url which points to nothing.  This will compromise data integrity of the database
            // but shouldn't cause any critical errors on the client or server
        } catch (e) {
            console.error(e);
        }

    }

    return iconPath;
}

/**
 * Returns the user with that userID or undefined
 * @param userID {String} The userID of the user that is to be found
 * @return {User|Undefined} The user's data
 */
function getUserByUserID(userID) {
    return getUserBy((user) => user.userID === userID);
}

/**
 * This callback is used for searching through all users.
 * @callback UserPredicate
 * @param {User} user The user that is to be predicated
 * @return {boolean} the return value
 */

/**
 * Returns the user with that userID or undefined
 * @param callback {UserPredicate}
 * @return {User|Undefined} The user's data
 */
function getUserBy(callback) {

    // if this system were to be used this would be replaced with a database call
    for (let i = 0; i < data.users.length; i++) {
        if (callback(data.users[i])) {
            return data.users[i];
        }
    }
    return undefined;
}

/**
 * Deletes a user from the database
 * @param userID {String} The userID of the user that is to be deleted
 * @return {Boolean} If the user was deleted successfully
 */
function deleteUserByUserID(userID) {

    // if this system were to be used this would be replaced with a database call
    for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].userID === userID) {
            data.users.splice(i, 1);
            return true;
        }
    }
    return false;
}

/**
 * Adds a new user to the database.  **This function doesn't check if a user with the same username or userID exists**
 * @param user {User} The user to be added
 */
function addUser(user) {
    data.users.push(user);
}

router.patch("/", function (req, res) {
    res.set("Content-Type", "application/json");

    const auth = authentication.authenticateRequest(req);
    if (auth === null) { // insufficient permissions, no permission
        res.status(403);
        res.end(JSON.stringify({message: "No authentication token provided"}));

    } else if (auth.userID !== req.body.userID && !auth.isAdmin) { // insufficient permissions, must be admin
        res.status(403);
        res.end(JSON.stringify({message: "Admin permission needed to access other user's data"}));

    } else if (req.body.isAdmin !== undefined && !auth.isAdmin) { // insufficient permissions, must be admin
        res.status(403);
        res.end(JSON.stringify({message: "Admin permission needed to alter admin status"}));

    } else if (req.body.userID === undefined) {
        res.status(400);
        res.end(JSON.stringify({message: "UserID not provided"}));

    } else if (typeof req.body.userID !== "string") {
        res.status(400);
        res.end(JSON.stringify({message: "UserID must be of type string"}));

    } else if (req.body.isAdmin === undefined && req.body.password === undefined) {
        res.status(400);
        res.end(JSON.stringify({message: "No values provided to be changed"}));

    } else if (req.body.isAdmin !== undefined && typeof req.body.isAdmin !== "boolean") {
        res.status(400);
        res.end(JSON.stringify({message: "isAdmin must be of type boolean"}));

    } else if (req.body.password !== undefined && typeof req.body.password !== "string") {
        res.status(400);
        res.end(JSON.stringify({message: "password must be of type string"}));

    } else {
        const user = getUserByUserID(req.params.userID);

        if (user === undefined) {
            res.status(404);
            res.end(JSON.stringify({message: "User not found"}));
        } else {

            if (req.body.isAdmin !== undefined) {
                user.isAdmin = req.body.isAdmin;
            }
            if (req.body.password !== undefined) {
                const hash = crypto.createHash("sha256");
                hash.update(req.body.password, "utf8");
                hash.update(user.salt, "utf8");
                user.password = hash.digest("hex");
            }

            res.status(200);
            res.end(JSON.stringify(user));
        }
    }
});

// `GET` for getting user data (authentication token required).
router.get('/:username', function (req, res) {
    res.set("Content-Type", "application/json");

    const auth = authentication.authenticateRequest(req);

    console.log(req.get("token"));

    if (auth === null) { // insufficient permissions, no permission
        res.status(403);
        res.end(JSON.stringify({message: "No authentication token provided"}));

    } else if (auth.userID !== req.params.userID && !auth.isAdmin) { // insufficient permissions, must be admin
        res.status(403);
        res.end(JSON.stringify({message: "Admin permission needed to access other user's data"}));

    } else if (req.params.userID === undefined) { // invalid request
        res.status(400);
        res.end(JSON.stringify({message: "UserID not provided"}));

    } else if (typeof req.params.userID !== "string") { // invalid request
        res.status(400);
        res.end(JSON.stringify({message: "UserID must be of type string"}));

    } else {

        const user = getUserByUserID(req.params.userID);

        if (user === undefined) {
            res.status(404);
            res.end(JSON.stringify({message: "User not found"}));

        } else {
            res.status(200);
            res.end(JSON.stringify(user));
        }
    }
});

// `PUT` for adding users and changing properties (this is only to be accessed by the administrator).
router.put('/', function (req, res) {
    res.set("Content-Type", "application/json");

    const auth = authentication.authenticateRequest(req);

    if (auth === null) {
        res.status(403);
        res.end(JSON.stringify({message: "No authentication token provided"}));

    } else if (!auth.isAdmin) {
        res.status(403);
        res.end(JSON.stringify({message: "Admin authentication token needed for adding users"}));

    } else if (req.body.username === undefined) {
        res.status(400);
        res.end(JSON.stringify({message: "Username not provided"}));

    } else if (typeof req.body.username !== "string") {
        res.status(400);
        res.end(JSON.stringify({message: "Username must be of type string"}));

    } else if (req.body.password === undefined || typeof req.body.password !== "string") {
        res.status(400);
        res.end(JSON.stringify({message: "Password must be of type string"}));
        // is admin can be inferred to be false so no error needs to be thrown

    } else {

        const user = getUserByUserID(req.body.username);

        if (user === undefined) { // adding a new user

            /**
             * Generates a random hex string of arbitrarily length
             * @param nibbles {Number} The length of the hex string (in 4 bits)
             * @return {string} The random string
             */
            function generateRandomHex(nibbles) {
                return [...Array(nibbles).keys()] // array of 0 through to 63 (inc)
                    .map((n) => (Math.random() * 16).toString(16))
                    .reduce((acc, cur) => acc + cur);
            }

            const salt = generateRandomHex(64); // generate a 256 bit hex encoded string

            let userID;
            do {
                userID = generateRandomHex(64);
            } while (getUserByUserID(userID) !== undefined);
            // The chance that this will be called more than once is somewhere on the order of 2^-246
            // (assuming 1024 users)

            const hash = crypto.createHash("sha256");
            hash.update(req.body.password, "utf8");
            hash.update(salt, "utf8");
            const hashedPassword = hash.digest("hex");

            addUser({
                userID: userID,
                username: req.body.username,
                displayName: generateDisplayName(),
                displayIcon: generateDisplayIcon(),
                salt: salt,
                password: hashedPassword,
                isAdmin: req.body.isAdmin === undefined ? false : req.body.isAdmin
            });

        } else { // user with that username already exists, clash
            res.status(409);
            res.end(JSON.stringify({message: "user with that username already exists"}));
        }
    }
});

// `DELETE` for deleting users(this is only to be accessed by the administrator).
router.delete('/', function (req, res) {
    res.set("Content-Type", "application/json");

    const auth = authentication.authenticateRequest(req);

    if (auth === null) { // insufficient permissions, no permission
        res.status(403);
        res.end(JSON.stringify({message: "No authentication token provided"}));
    } else if (auth.userID !== req.params.userID && !auth.isAdmin) { // insufficient permissions, must be admin
        res.status(403);
        res.end(JSON.stringify({message: "Admin permission needed to access other user's data"}));
    } else if (req.params.userID === undefined) {
        res.status(400);
        res.end(JSON.stringify({message: "userID not provided"}));
    } else if (typeof req.params.userID !== "string") {
        res.status(400);
        res.end(JSON.stringify({message: "userID must be of type string"}));
    } else {

        const success = deleteUserByUserID(req.params.userID);

        if (success) {
            res.status(200);
            res.end();
        } else {
            res.status(404);
            res.end(JSON.stringify({message: "User not found"}));
        }
    }
});

// `POST` for getting an authentication token that the client can then use to be granted access to other APIs.
router.post('/', function (req, res) {
    res.set("Content-Type", "application/json");

    if (req.body.username === undefined) { // invalid request
        res.status(400);
        res.end(JSON.stringify({message: "Username not provided"}));

    } else if (typeof req.body.username !== "string") { // invalid request
        res.status(400);
        res.end(JSON.stringify({message: "Username must be of type string"}));

    } else if (req.body.password === undefined) {
        res.status(400);
        res.end(JSON.stringify({message: "Username not provided"}));

    } else if (typeof req.body.password !== "string") {
        res.status(400);
        res.end(JSON.stringify({message: "Username must be of type string"}));

    } else { // request is valid

        const user = getUserBy((user) => user.username === req.body.username);

        const hash = crypto.createHash("sha256");
        hash.update(req.body.password, "utf8");
        hash.update((user === undefined || user.salt === undefined) ? "" : user.salt, "utf8");
        const hashedPassword = hash.digest("hex");

        if (user === undefined || user.password !== hashedPassword) { // invalid credentials
            res.status(403);
            res.end(JSON.stringify({message: "The username and password pair was invalid"}));
            // I make sure that the hash is computed even if the username is invalid so that an attacker can't guess
            // valid username based on the time that it takes the server to respond

        } else { // valid username and password pair

            res.status(200);
            const message = {
                userID: user.userID,
                validUntil: new Date().getTime() + config.authenticationTokenDuration,
                isAdmin: false
            };
            const hash = crypto.createHash("sha256");
            hash.update(JSON.stringify(message), "utf8");
            hash.update(config.privateKey, "utf8");
            const signature = hash.digest("hex");

            res.end(JSON.stringify({message: message, signature: signature, user: user}));
        }
    }
});

module.exports = router;
