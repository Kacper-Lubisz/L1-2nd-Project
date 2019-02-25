# Design
In this file I'm going to talk a bit about the design process that went into making this project.

## Proposition
The proposed project is to make a peer review software, much like that used by Steven for reviewing the first 
programming summative.  The minimum viable product would be to essentially recreate the existing system, though the goal
is to make an improved system.

Gonna' name it DurPeer, *Durham + Peer Review = DurPeer*

## Goals

These are the very general goals for the project:
* Increase the efficiency of the review process (produce higher quality reviews with less time)
    * More granular marking criteria with less granular grades    
* Increase perceived fairness
    * Have large review sample sizes
    * Allow for rebutting of reviews
    * Allow for group consensus to be reached
* Give important charts and statistics (admin and users)

## Features

This section is an overview of the features and their justifications, this is all subject to change during the 
implementation process.

Features:
* An arbitrary amount of reviews can be made
    * With diminishing returns this will increase the peer review mark that the reviewer gets.
    * This will likely lead to a large number of peer reviews
* An arbitrary amount of critiques can be made
    * A critique is the review of a peer review
    * A reviewer will need to do a balance of reviews and critiques to make sure they get a good peer review mark
    * When a critique is received, the original author of the review will have time to accept or reject the review. The
    result of this decision will impact the reputations of both reviewers.
    * If after a critique is ignored the critic decides to stand their ground, a public vote will be held. 
* Each reviewer has a reputation
    * Reputation determines end mark for quality of peer review
    * Reputation has no other function (doesn't influence marks), other than the psychological influence it has on 
    reviewers
    * Reputation is displayed next to the anonymous name of a critique writer, this is to influence the decision of 
    critique receiver.
    * Reputation is calculated based on the number of reviews and critiques made, but also on the success rate of 
    critiques. An average reputation can be gained by doing peer reviews and critiques, a high reputation can only be 
    gained through successful critiques.
* The website is to follow a one page design
    * The website should push history to alter the URL rather than reloading
    * The main page should consist of a simple feed showing the (suggested) options (e.g. write review, write critique).
* Easy to setup from the perspective of the administrator
    * Easy to specify the body of work that needs to be reviewed
    * The administrator should be able to monitor how the reviewing process is going

## ER Modeling
I will model all the entities in my system as though it were an database, since if this system were to be deployed it 
would need to.  It would be much easier to store this data in a simple json file format, but I will store it in tables
simple for the purpose of making the project closer to a real deployable system.

### User
User(__userID__, loginName, displayName, displayIconURL, salt, hashedPassword)

This relation stores the information about a user.  UserID should be a random string to prevent the posibility of sequentially scraping through all the data.  The loginName is different to the display name for the purposes of 
preserving the anonymity of users.  The display name and display icon will be generated automatically when the user is 
created.  The password is stored using cryptography to make it so that the original password can't be recovered even if
a data breach occurs.  The password has the salt concatenated to it and is then hashed.  The purpose of the hash is to 
provide a one way operation, such that the password can't be recovered.  The password is salted before the hash to
ensure that users which are using the same password have a different entry in the data base.  This makes it so that 
common passwords can't be identified.   

### Work
Work(__assignmentID__, __userID__, localUrl)

This relation represents a piece of work.  It links together a user and their work with an assignment.  localUrl stores
the path to the work in relative to the path of the folder containing all the work for that assignment.

### Assignment
Assignment(__assignmentID__, title, workUrl)

This relation represents an assignment, this is because the system should allow for the concurrent peer review of
several assignments at the same time.  The title is simply the identifier for the assignment.  workUrl is the path to 
the folder containing all of the work for this project relative to the root of the server.  When a new assignment is 
created by the admin all of the work will be moved into this folder.  This path will be generated automatically based on
the assignmentID.

### Marking Category
MarkingCategory(__categoryID__, __assignmentID__, title, weight)

This is relation is used to store all the marking categories for an assignment.  For this assignment it would be 
* Client-side functionality criteria
* Client-side quality criteria
* Server-side functionality criteria
* Server-side quality criteria
* Extensions criteria

The weight is stored so that some categories can be worth more than others.  These categories are then further described
by the marking criteria relation.

### Marking Criteria
MarkingCriteria(__criteriaID__, __categoryID__, weight, subtitle, description)

This relation stores the sub categories that the marking criteria is split into.  If a category is to have a single
grade given to it, then it needs to have a singular marking criteria.  The marking criteria also has a weight to allow 
it to be weighted within the category.  The subtitle is simply the name of the criteria.  The description stores 
information to guide the reviewer as to what they should focus on when evaluating this criteria.

### Review
Review(__assignmentID__, __userID__, __reviewerID__, comment, isCompleted)

This relation represents a review that would have been given to a piece of work.  Most of the review data will be stored
in the Grade relation.  This relation only really stores a general comment to help guide the recipient of the review.
It also contains comments that don't belong to any particular category.  The completion of the review is also stored so
that it doesn't need to be evaluated each time it is accessed.

### Grade
Grade(__assignmentID__, __ownerID__, __reviewerID__, __criteriaID__, mark, comment)

This relation stores a particular rating given for a category.  The composite primary key identifies the piece of work(__assignmentID__, __ownerID__) and then what the grade is for and who left it (__reviewerID__, __criteriaID__).
mark is a number form 0 to 1 representing the scale
from 0% to 100%.  When this tuple is created the mark calculated based on the rating that is given on this scale: 
* No Attempt(0%)
* Unacceptable(20%)
* Passable(40%)
* Good(60%)
* Great(80%)
* Exemplary(100%)

The comment is used to give a justification for why the mark was given.

### Critique 
Critique(__assignmentID__, __ownerID__, __criticID__, __criteriaID__, proposedMark, comment, state)

This relation stores a criticism of a review.  The first two keys (of the primary key) identify a piece of work, the next identifies the user who left the critique and then the final identifies the criteria of their review that is being criticiesed.
 The proposed mark is the mark 
that the criticism believes should be given.  it is notable that a critique will be stored even if it agrees with the
original review.  The comment is used to explain why the proposed mark differed from the one given in the original 
review and should in general explain why the critic believes that the original review was bad.  The state is used to 
precedent what stage in the life cycle of a critique it is. This is the key: 
* 0 - Agreeing (no action needed)
* 1 - Submitted (disagreeing with original, not responded to, action needed)
* 2 - Accepted (the author of the original review has accepted the correction)
* 3 - Rejected (the author of the original review has rejected the correction)


## API documentation

### Endpoint Overview

API documentation can be found in apidocs.md

This is the list of all the endpoints:
* `/users` for managing the users
    * `GET` for getting user data (authentication token required).
    * `PUT` for adding users and changing properties (this is only to be accessed by the administrator).
    * `DELETE` for deleting users(this is only to be accessed by the administrator).
    * `POST` for getting an authentication token that the client can then use to be granted access to other APIs.
    
* `/assignments` for creating a new assignment
    * `GET` for fetching the properties of an assignment, including all the marking criteria (authentication token 
    required).
    * `PUT` for creating a new assignment, this also creates user data and marking categories and criteria.  This can be
     done with multiple calls to the API to allow for saving progress (requires admin authentication).

* `/notifications` this is for finding any actions that the user needs to take action on
    * `GET` computes and returns a list of things that needs attention (critiques that haven't been addressed) for that 
    particular user (authentication token required).

* `/reviews` This endpoint is for creating and fetching reviews
    * `GET` this has different uses 
        * returns all the reviews that a user has started (authentication token required, admin if not for self)
        * returns all the reviews on a piece of work (authentication token required, admin if not yours, admin if the 
        review isn't submitted)
        * returns the contents of a particular review (authentication token required, admin if not your review or of 
        your work)
    * `POST` allows a user to start working on a new review (authentication token required)
    * `PUT` updates a review (authentication token required, review must be the users)
    
* `/critiques` This endpoint is for creating and fetching critiques
    * `GET` this has different uses 
        * returns all the critiques that a user has started (authentication token required, admin if not for self)
        * returns all the critiques of a review (authentication token required, admin if not your review, admin if 
        critique isn't submitted)
        * returns the contents of a particular critique (authentication token required, admin if not your critique or of 
        your review)
    * `POST` allows a user to start working on a new critique (authentication token required)
    * `PUT` updates a critique (authentication token required, review must be the users)
