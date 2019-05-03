const express = require("express");
const crypto = require("crypto");

const PNGImage = require("pngjs-image");
const fs = require("fs");

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
  // TODO replace this with an API call to have random words server
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
      alpha: 255,
    };
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
      // console.error(e);
      throw e;
    }

  }

  return iconPath;
}

/**
 * GET '/users'
 * See apidocs.md
 */
router.get("/", async function (req, res, next) {

  try {

    const auth = await authentication.verify(req.headers.token);

    if (auth === undefined) { // insufficient permissions, no permission
      res.status(403).json({message: "No authentication token provided"});

    } else {
      const selectingUser = data.users.find((user) => user.email === auth.email);
      // the user can be selected by userID or by userEmail

      if (selectingUser === undefined) {
        res.status(403).json({message: "Authentication token belongs to no user"});
      } else if (req.query.userID !== undefined && req.query.email !== undefined) { // type checks are not necessary
        res.status(400).json({message: "Must select user by userID or email"});
      } else if (req.query.userID !== undefined) { // select user by the user id

        if (selectingUser.userID === req.query.userID) {
          res.status(200).json(selectingUser);
        } else if (!selectingUser.isAdmin) {
          res.status(403).json({message: "Admin permission needed to access other users"});
        } else {
          const selectedUser = data.users.find((user) => user.userID === req.query.userID);

          if (selectedUser === undefined) {
            res.status(404).json({message: `No user found with userID ${req.query.userID}`});
          } else {
            res.status(200).json(selectedUser);
          }
        }

      } else if (req.query.email !== undefined) { // select user by the email

        if (selectingUser.email === req.query.email) {
          res.status(200).json(selectingUser);
        } else if (!selectingUser.isAdmin) {
          res.status(403).json({message: "Admin permission needed to access other users"});
        } else {
          const selectedUser = data.users.find((user) => user.email === req.query.email);

          if (selectedUser === undefined) {
            res.status(404).json({message: `No user found with email ${req.query.email}`});
          } else {
            res.status(200).json(selectedUser);
          }
        }

      } else {
        res.status(400).json({message: "Must select user by userID or email"});
      }
    }

  } catch (e) {
    next(e);
  }

});

module.exports = router;
