const config = require("./config/config");

const {OAuth2Client} = require("google-auth-library");
const client = new OAuth2Client(config.clientId);

/**
 * This function is used for authenticating users.  It accepts a token string, which is supplied by Google, and then
 * using Google's auth library verifies that the token is valid.  It returns the user payload, if the token is valid
 * and the email is verified by Google.
 * @param token {String} the login token provided by google
 * @return {Promise<TokenPayload|undefined>} The object containing basic user information, or undefined if not
 * authenticated
 */
const verify = async function (token) {

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
      // console.error(e);
      return undefined;
    }

  }
};

const testVerify = async function (token) {
  if (token === "user0token") {
    return {email: "youremail@address.here"};
  } else if (token === "user1adminToken") {
    return {email: "admin@nothing.com"};
  } else if (token === "notAnUserToken") {
    return {email: "thisEmail@is.not.used"};
  } else {
    return undefined;
  }
};

module.exports.verify = process.env.NODE_ENV === "test" ? testVerify : verify;

/*
To bypass authentication:

replace: module.exports.verify = process.env.NODE_ENV === "test" ? testVerify : verify;
with: module.exports.verify = ()=>{return {email:"youremail@address.here"}}

 */