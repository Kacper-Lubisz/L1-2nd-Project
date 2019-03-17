const config = require("./config/config");

/**
 * The authentication message from the server
 * @typedef {Object} Message
 * @property {string} username - The username
 * @property {boolean} isAdmin - If said user is an admin
 */

/**
 * This function is used for validating the authentication token that is sent with a request.
 * @param request {Object} The raw request object
 * @return {Message|null} The authentication level of the client, either 'none', 'user' or 'admin'
 */
function authenticateRequest(request) {

    const token = request.header.token;

    if (token === undefined || token.message === undefined || token.signature === undefined) {
        return null;
    } else {

        console.log(">"+config.privateKey+"<");

        const hash = crypto.createHash("sha256"); // find the correct signature
        hash.update(JSON.stringify(token.message), "utf8");
        hash.update(config.privateKey, "utf8");
        const correctSignature = hash.digest("hex");


        if (token.signature !== correctSignature) { // invalid signature
            return null;
        } else {
            // the fact that the signature is correct proves that the private key was used in creating the signature,
            // which proves that the message was created on the server
            return message;
        }
    }
}

module.exports.authenticateRequest = authenticateRequest;