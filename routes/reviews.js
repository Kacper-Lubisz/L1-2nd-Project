var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    // TODO add authentication



});

module.exports = router;

/*

This endpoint is used for getting reviews.  There are different ways to select reviews when using this endpoint.
  * By user, all the reviews started by a particular user (authentication token required, admin if not for self)
  * By work, all the reviews on a piece of work (authentication token required, admin if not yours, admin if the
        review isn't submitted)
  * By id, the particular review (authentication token required, admin if not your review or of your work)
  * By nothing, returns all the reviews (admin authentication token required)

These different selections can be made by providing particular parameters.  Notably, critiques behave differently
depending on the user that is making the request:
  * Owner, can access all reviews and critiques but only after the marking period is over
  * Reviewer, can access the reviews of the work that they have reviewed and their critiques
  * Critic, can access the reviews and their own critiques on review they have been assigned to critique

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by a user/admin | Header
userID | Optional | String | The user who's reviews are to be fetched | Body
work | Optional | WorkID | The work which's reviews are to be fetched | Body
review | Optional | ReviewID | The particular review to be fetched | Body

 */
