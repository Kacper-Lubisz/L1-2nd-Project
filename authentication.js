const config = require("./config/config");

const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(config.clientId);

async function verify(token) {

    if (token === undefined) {
        return undefined;
    } else {

        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: config.clientId,
            });
            const payload = ticket.getPayload();
            if (payload.email_verified === true) {
                return payload;
            } else {
                return undefined;
            }
        } catch (e) {
            console.error(e);
            return undefined;
        }

    }
}

module.exports.verify = verify;