const express = require('express');
const crypto = require('crypto');
const authentication = require("../authentication");
const config = require("../config/config");

const data = require("../database");

const router = express.Router();

/**
 * Returns the user with that username or undefined
 * @param username {String} The username of the user that is to be found
 * @return {User|Undefined} The user's data
 */
function getUserByUsername(username) {

    // if this system were to be used this would be replaced with a database call
    for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].username === username) {
            return data.users[i];
        }
    }
    return undefined;
}

/**
 * Deletes a user from the database
 * @param username {String} The username of the user that is to be deleted
 * @return {Boolean} If the user was deleted successfully
 */
function deleteUserByUsername(username) {

    // if this system were to be used this would be replaced with a database call
    for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].username === username) {
            data.users.splice(i, 1);
            return true;
        }
    }
    return false;
}

// `GET` for getting user data (authentication token required).
router.get('/:username', function (req, res) {

    const auth = authentication.authenticateRequest(req);

    if (req.params.username === undefined) { // invalid request
        res.status(400);
        res.end(JSON.stringify({message: "Username not provided"}));
    } else if (auth === null) { // insufficient permissions, no permission
        res.status(403);
        res.end(JSON.stringify({message: "No authentication token provided"}));
    } else if (auth.username !== req.params.username && !auth.isAdmin) { // insufficient permissions, must be admin
        res.status(403);
        res.end(JSON.stringify({message: "Admin permission needed to access other user's data"}));
    } else {

        const user = getUserByUsername(req.params.username);

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
    const auth = authentication.authenticateRequest(req);
    // TODO
});

// `DELETE` for deleting users(this is only to be accessed by the administrator).
router.delete('/', function (req, res) {
    const auth = authentication.authenticateRequest(req);

    if (req.params.username === undefined) {
        res.status(400);
        res.end(JSON.stringify({message: "Username not provided"}));
    } else if (auth === null) { // insufficient permissions, no permission
        res.status(403);
        res.end(JSON.stringify({message: "No authentication token provided"}));
    } else if (auth.username !== req.params.username && !auth.isAdmin) { // insufficient permissions, must be admin
        res.status(403);
        res.end(JSON.stringify({message: "Admin permission needed to access other user's data"}));
    } else {

        const success = deleteUserByUsername(req.params.username);

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

    if (req.body.username === undefined) { // invalid request
        res.status(400);
        res.end(JSON.stringify({message: "Username not provided"}));

    } else if (req.body.password === undefined) {
        res.status(400);
        res.end(JSON.stringify({message: "Username not provided"}));

    } else { // request is valid

        const user = getUserByUsername(req.body.username);

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
                username: req.body.username,
                validUntil: new Date().getTime() + config.authenticationTokenDuration,
                isAdmin: user.isAdmin
            };
            const hash = crypto.createHash("sha256");
            hash.update(JSON.stringify(message), "utf8");
            hash.update(config.privateKey, "utf8");
            const signature = hash.digest("hex");

            res.end(JSON.stringify({message: message, signature: signature}));
        }
    }
});

module.exports = router;
