# API Documentation

## `GET` `/users`
This endpoint can be used for getting the information about a users or for discovering if there is a user account 
associated with an authentication token. 

The user can be selected buy userID or email (which are both primary keys, bit redundant yes, this is bad, no time to 
fix).

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | String | Google provided auth token | Header
userID | Optional | String | The userID of the user to be fetched | Query
email | Optional | String | The email of the user to be fetched | Query

Example Query:
```
?userID=3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF
```

### Responses

#### `OK` 200 - Successful fetch
Response schema:
```
Response {
  userID (String, required): The id of the user
  email (String, required): The user's email address
  displayName (String, required): The user's displayName
  identicon (String, required): The URL to the users icon
  isAdmin (boolean, required): If the user is an admin
}
```
example, 
```json5
{
  "userID": "3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF",
  "email": "youtemail@address.here",
  "displayName": "Adjective Noun",
  "identicon": "/icons/FF6F00.png",
  "isAdmin": false
}
```
#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
Response schema,
```
Response {
  message (String, required): String explanation of invalid authentication token
}
```
example, 
```json5
{
  message: "Invalid authentication token"
}
```
#### `Bad Request` 400 - Invalid Parameter
##### Response schema
```
Response {
  message (String, required): String explanation
}
```
example, 
```json5
{
  message: "No userID provided"
}
```
#### `Not Found` 404 - No such user exists
##### Response schema
```
Response {
  message (String, required): String explanation
}
```
example, 
```json5
{
  message: "No such user exists"
}
```

---
 

## `GET` `/assignments` 
This endpoint can be used for getting the information about assignments, it returns the assignment relation but also 
all related category and criteria relations.

This end point has three different methods for selecting:
  * Select by ownerID, return all assignments that a particular user has work for
  * Select by assignmentID, return the one specific assignment
  * Select by nothing, returns all assignments (requires admin permission)

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | String | Google provided auth token | Header
ownerID | Optional | String | The userID of the user who's assignments are to be fetched | Query
assignmentID | Optional | String | The id of the assignment to be fetched | Query

Example Body:
```
?userID=3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF
```

### Responses

#### `OK` 200 - Successful fetch
Response schema:
```
Response [Assignment]

Response {
  markingCategories (MarkingCategory[], required): The list of marking categories for this assignment
  assignmentID (String, required): The id of the assignment
  title (String, required): The title of the assignment
  blurb (String, required): The summary of the assignment
  submissionOpen (Number, required): The unix time stamp of the time at which sumbissions open 
  submissionClose (Number, required): The unix time stamp of the time at which sumbissions close
  reviewsOpen (Number, required): The unix time stamp of the time at which reviews open
  reviewsClose (Number, required): The unix time stamp of the time at which reviews close
  critiquesOpen (Number, required): The unix time stamp of the time at which critiques open
  critiquesClose (Number, required): The unix time stamp of the time at which critiques close
  resultsPublish (Number, required): The unix time stamp of the time at which results publish
  minReviews (Number, required): The minumum number of reviews to get 100% for reviews
  minCritiques (Number, required): The minumum number of critiques to get 100% for critiques 
  work (Work, required): The information about the piece of work that the user has for this assignment
}

MarkingCategory {
  markingCriteria (MarkingCriteria[], required): The list of marking criteria that belong to this category
  assignmentID (String, required): The id of the assignment
  categoryID (String, required): The id of the category
  title (String, required): The title of the category
  description (String, required): The description of the category
  weight (Number, required): How much the category is worth
}

MarkingCriteria {
  assignmentID (String, required): The id of the parent assignment
  categoryID (String, required): The id of the parent category
  criteriaID (String, required): The id of the criteria 
  weight (Number, required): How much this criteria is worth
  subtitle (String, required):  The title of the criteria
  description (String, required): A description of this criteria describing how it should be marked
}

Work {
  assignmentID (Stringm, required) the id of the assignment
  workerID (String, required): The id of the worker
  submissionTime (Number, required):  The unix time stamp of the time at which work was submitted
}
```
example, 
```json5
[
  {
    "markingCategories": [
      {
        "markingCriteria": [
          {
            "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
            "categoryID": "0000000000000000000000000000000000000000000000000000000000000000",
            "criteriaID": "0000000000000000000000000000000000000000000000000000000000000000",
            "weight": 1,
            "subtitle": "First Criteria",
            "description": "Some words 1"
          },
          {
            "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
            "categoryID": "0000000000000000000000000000000000000000000000000000000000000000",
            "criteriaID": "0000000000000000000000000000000000000000000000000000000000000001",
            "weight": 1,
            "subtitle": "Second Criteria",
            "description": "Some words 2"
          }
        ],
        "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
        "categoryID": "0000000000000000000000000000000000000000000000000000000000000000",
        "title": "First Category",
        "description": "Some words 1",
        "weight": 1
      },
      {
        "markingCriteria": [
          {
            "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
            "categoryID": "0000000000000000000000000000000000000000000000000000000000000001",
            "criteriaID": "0000000000000000000000000000000000000000000000000000000000000000",
            "weight": 1,
            "subtitle": "First Criteria",
            "description": "Some words 1"
          },
          {
            "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
            "categoryID": "0000000000000000000000000000000000000000000000000000000000000001",
            "criteriaID": "0000000000000000000000000000000000000000000000000000000000000001",
            "weight": 1,
            "subtitle": "Second Criteria",
            "description": "Some words 2"
          }
        ],
        "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
        "categoryID": "0000000000000000000000000000000000000000000000000000000000000001",
        "title": "Second Category",
        "description": "This is about how good your code is",
        "weight": 1
      }
    ],
    "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
    "title": "Project 3",
    "blurb": "This is basically some code that you have to write",
    "submissionOpen": 1554734232868,
    "submissionClose": 1554824500557,
    "reviewsOpen": 0,
    "reviewsClose": 0,
    "critiquesOpen": 0,
    "critiquesClose": 0,
    "resultsPublish": 1554824500557,
    "minReviews": 4,
    "minCritiques": 10,
    "work": {
      "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
      "workerID": "0000000000000000000000000000000000000000000000000000000000000000",
      "submissionTime": 0
    }
  }
]
```
#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
Response schema,
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
example, 
```json5
{
  message: "Invalid authentication token"
}
```
#### `Bad Request` 400 - Invalid Parameter
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
example, 
```json5
{
  message: "Type of ownerID must be string"
}
```
#### `Not Found` 404 - No such assignment exists
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
example, 
```json5
{
  message: "No assignment found with assignmentID ..."
}
```

---

## `GET` `/reviews`
This endpoint is used for getting reviews and critiques.  This endpoint also returns all the reviews and critiques on 
the work of a user.  There are two ways to select when using this endpoint:
  * By ownerID, all the reviews/critiques started by a particular user (authentication token required, admin if not 
  for self)
  * By nothing, returns all the reviews and critiques (admin authentication token required)

When selecting by owner the results are returned in three separate lists, signifying the owners relation to the review.
This can be: the owner is the worker on the reviews and assignments; the owner is the reviewer or, the owner is the 
critic.  On the other hand when all reviews are selected, they are returned in one list

The reviews are returned in three lists, depending on their relation with the user.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by a user/admin | Header
ownerID | Optional | String | The user who's reviews/critiques are to be fetched | Query

Example Body:
```
?ownerID=83566c4039f629d0f95b2e3a9e4306fa15873c898a76117a21a667950b49ba8e
```

### Responses

#### `OK` 200 - Successfully fetch
##### Response schema
```
Response {
  worker: (Review[], Optional): The array of reviews of the owners works
  reviewer: (Review[], Optional): The array of reviews that were created by the owner
  critic:(Review[], Optional): The array of reviews that are critiqued by the owner
  reviews:(Review, Optional): The array of all reviews and critiques
}

CriticReview extends Review {
  critique (Critique, required): The singular critique of the owner
}

Review {
  assignmentID (String, required): Part of the composite key that identifies the work being reviewed
  workerID (String, required): Part of the composite key that identifies the work being reviewed
  work (Work, required): The information about the work that this review is of
  reviewerID (String, required): The key that identifies the author of the review
  reviewer (UserData, required): The basic information about the user who created the review
  comment (String, required): The comment left by the reviewer
  submissionTime (Number|null, required): The time at which the review was submitted or otherwise null
  grades (Grade[], required): The grades associated with the review
  critiques (Critique[], required): The critiques associated with the review
}

Grade {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade)
  workerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade) 
  reviewerID (String, required): The id of the reviewer who left the review
  categoryID (String, required): The id of the category that is being graded
  criteriaID (String, required): The id of the criteria that is being graded
  mark (Number, required): The mark given to the piece of work in the specific criteria
  comment (String, required): Explanation of the mark
}

Critique {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued)
  workerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued) 
  reviewerID (String, required): The id of the reviewer who left the review (identifies)
  criticID (String, required): The id of the user that started the critique
  critic (UserData, required): The basic information about the user who created the critique
  submissionTime (Number|null, required): The time at which the critique was submitted or otherwise null
  critiquedGrades (CritiquedGrade[], required): The list of grades that the critique desires to alter  
}

CritiquedGrade {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued)
  workerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued) 
  reviewerID (String, required): The id of the reviewer who left the review (identifiers)
  criticID (String, required): The id of the user that started the critque
  criteriaID (String, required): Thd id of the criteria that this grade is part of
  categoryID (String, required): Thd id of the category that this grade is part of
  proposedMark (Number, required): The mark proposed by the critique,
  comment (String, required): The exaplantion of the critiqued mark
  state (Number, required): The state of the critiqued grade (Proposed, Accepted, Rejected)
}

Work {
  assignmentID (Stringm, required) the id of the assignment
  workerID (String, required): The id of the worker
  submissionTime (Number, required):  The unix time stamp of the time at which work was submitted
  worker (UserData, required): The basic information about the user who created the work
}

UserData {
  userID (String, required): The id of the user
  displayName (String, required): The user's displayName
  identicon (String, required): The URL to the users icon
}

```

example,
```json5
{
  "worker": [
    {
      "grades": [
        {
          "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
          "workerID": "0000000000000000000000000000000000000000000000000000000000000000",
          "reviewerID": "0000000000000000000000000000000000000000000000000000000000000001",
          "categoryID": "0000000000000000000000000000000000000000000000000000000000000000",
          "criteriaID": "0000000000000000000000000000000000000000000000000000000000000000",
          "mark": 0.5,
          "comment": "comment 1"
        }
      ],
      "critiques": [
        {
          "critiquedGrades": [
            {
              "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
              "workerID": "0000000000000000000000000000000000000000000000000000000000000000",
              "reviewerID": "0000000000000000000000000000000000000000000000000000000000000001",
              "criticID": "0000000000000000000000000000000000000000000000000000000000000002",
              "categoryID": "0000000000000000000000000000000000000000000000000000000000000000",
              "criteriaID": "0000000000000000000000000000000000000000000000000000000000000000",
              "proposedMark": 0.4,
              "comment": "comment 1",
              "state": 4
            }
          ],
          "critic": {
            "userID": "0000000000000000000000000000000000000000000000000000000000000002",
            "displayName": "Name 2",
            "identicon": "/icons/33691E.png"
          },
          "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
          "workerID": "0000000000000000000000000000000000000000000000000000000000000000",
          "reviewerID": "0000000000000000000000000000000000000000000000000000000000000001",
          "criticID": "0000000000000000000000000000000000000000000000000000000000000002",
          "submissionTime": 0
        }
      ],
      "work": {
        "worker": {
          "userID": "0000000000000000000000000000000000000000000000000000000000000000",
          "displayName": "Name 0",
          "identicon": "/icons/FF6F00.png"
        },
        "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
        "workerID": "0000000000000000000000000000000000000000000000000000000000000000",
        "submissionTime": 0
      },
      "reviewer": {
        "userID": "0000000000000000000000000000000000000000000000000000000000000001",
        "displayName": "Name 1",
        "identicon": "/icons/01579B.png"
      },
      "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
      "workerID": "0000000000000000000000000000000000000000000000000000000000000000",
      "reviewerID": "0000000000000000000000000000000000000000000000000000000000000001",
      "comment": "comment 1",
      "submissionTime": 0
    }
  ],
  "reviewer": [],
  "critic": []
}
```
#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
example,
```json5
{
  message: "Reviews of your own work are not available until reviewing is over"
}
```

#### `Forbidden` 403 - The credential's were invalid/insufficient
##### Response schema
```
Error {
  message (String, required): String explanation of invalid credentials
}
```
example,
```json5
{
  message: "Invalid authentication token"
}
```

---

## `PATCH` `/reviews`
This endpoint is for both updating reviews and critiques.  This end point takes different parameters depending on the 
usage: patching reviews or patching critiques.  The two requests take very similar but have small differences in their 
parameters.  In either case, only the grades that are passed are updated in the database, this means grades that are 
intended to be cleared need to be passe with null values for their mark and comment.  This endpoint also allows for
submitting reviews and critiques.  If the review/critique is submitted then the time stamp at which it was submitted
will be returned (allowing for the client to update their stored version of the review/critique).

Authentication in this endpoint is done on the basis of the owner of the review/critique.  The user that is making the 
request (known from auth token) can only edit their own reviews and their own critiques unless they have admin 
privileges.

In hindsight this is a badly designed API (because of the different ways that it can be used) and ought to be split 
into two separate APIs (or at least way inputs are fed into it changed), of course this would have been improved if it 
wasn't for the looming deadline.


### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by the user | Headers
assignmentID | Required | String | The id of the assignment to update | Body
workerID | Required | String | The id of the worker to update | Body
reviewerID | Required | String | The id of the reviewer to update | Body
grades | Optional (for review) | Grade | The list of grades that are to be updates | Body
comment | Optional (for review) | String | The comment on the review | Body 
criticID | Optional  (for critique) | String | The id of the critic to update | Body
critiquedGrades | Optional (for critique) | CritiquedGrade | The list of critiqued grades that are to be updated | Body
submit | Required | Boolean | If the review/critique is to be submitted or not | Body
```
Grade {
  categoryID (String, required): The id of the criteria that is being graded
  criteriaID (String, required): The id of the criteria that is being graded
  mark (Number, required): The mark given to the piece of work in the specific criteria
  comment (String, required): Explanation of the mark
}

CritiquedGrade {
  categoryID (String, required): The id of the criteria that is being graded
  criteriaID (String, required): The id of the criteria that is being graded
  proposedMark (Number, required): The proposed mark given to the piece of work in the specific criteria
  comment (String, required): Explanation of the grade being criqitued
}
```

Example Body:
```
{
  assignmentID: "0000000000000000000000000000000000000000000000000000000000000001",
  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
  grades: [
    {
      categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
      criteriaID: "0000000000000000000000000000000000000000000000000000000000000000",
      comment: "some comment here 7",
      mark: 0.5
    },
  ],
  comment: "comment 7",
  submit: false
}
```

### Responses

#### `Success` 200  - Successfully updated review/critique
##### Response schema
Empty Response

#### `Success` 200  - Successfully **submitted** review/critique
##### Response schema
```json5
{submissionTime: 1556665187650}
```

#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
example,
```json5
{
  message: "Invalid authentication token"
}
```

#### `Not Found` 404 - No such review/critique
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
example,
```json5
{
  message: "No such review exists"
}
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
example,
```json5
{
  message: "Review can't be marked as complete until all criteria are reviewed"
}
```

---

## `POST` `/reviews`
This endpoint is used for creating new reviews and critiques.  The piece of work (or review) that is reviewed (or 
critique) will be selected from all critiques that the user is not involved in (e.g. Can't review own work).  If there
are no works/reviews for the user to review/critique then the server will respond with an error (status code 503).
The endpoint will provide the information about the new review/critique as though it were fetched using `GET` 
`/reviews`.

When creating a new review, the reviewerID is to be defined and when creating a new critique the criticID is to be 
defined.  If these IDs are not the same as the user making the request (from authentication token) then admin 
privileges are required (only admins can create reviews/critiques for other people). 

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by the user | Headers
assignmentID | Required | String | The id of the assignment, part of key pointing to review/critique | Body
reviewerID | Optional | String | The id of the reviewer, part of key pointing to review/critique | Body
critiqueID | Optional | String | The id of the critic, part of key pointing to review/critique | Body

Example Body:
```json5
{
  assignmentID: "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
  reviewerID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",        
}  
```

### Responses

#### `Success` 200  - Successfully created review
##### Response schema
```
CriticReview extends Review {
  critique (Critique, required): The singular critique of the owner
}

Review {
  assignmentID (String, required): Part of the composite key that identifies the work being reviewed
  workerID (String, required): Part of the composite key that identifies the work being reviewed
  work (Work, required): The information about the work that this review is of
  reviewerID (String, required): The key that identifies the author of the review
  reviewer (UserData, required): The basic information about the user who created the review
  comment (String, required): The comment left by the reviewer
  submissionTime (null, required): The time at which the review was submitted or otherwise null
  grades (Empty Array, required): The grades associated with the review
  critiques (Empty Array, required): The critiques associated with the review
}

Work {
  assignmentID (Stringm, required) the id of the assignment
  workerID (String, required): The id of the worker
  submissionTime (Number, required):  The unix time stamp of the time at which work was submitted
  worker (UserData, required): The basic information about the user who created the work
}

UserData {
  userID (String, required): The id of the user
  displayName (String, required): The user's displayName
  identicon (String, required): The URL to the users icon
}


```

example,
```json5
{
  assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
  workerID: "0000000000000000000000000000000000000000000000000000000000000004",
  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
  comment: null,
  submissionTime: null,
  grades: [],
  critiques: [],
  reviewer: {
    userID: "0000000000000000000000000000000000000000000000000000000000000000",
    displayName: "Name 0",
    identicon: "/icons/FF6F00.png"
  },
  work: {
    worker: {
      userID: "0000000000000000000000000000000000000000000000000000000000000004",
      displayName: "Name 4",
      identicon: "/icons/F57F17.png"
    },
    assignmentID: "0000000000000000000000000000000000000000000000000000000000000000",
    workerID: "0000000000000000000000000000000000000000000000000000000000000004",
    submissionTime: "0000000000000000000000000000000000000000000000000000000000000000"
  }
}
```

#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
example,
```json5
{
  message: "Invalid authentication token"
}
```

#### `Not Found` 404 - No such assignment exists
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
example,
```json5
{
  message: "No such assignment exists"
}
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
example,
```json5
{
  message: "assignmentID must be of type string"
}
```

---

## `POST` `/critiques`
This endpoint is for accepting or rejecting critiques.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by the user | Headers
assignmentID | Required | String | The id of the assignment, part of key pointing to the critiqued grade | Body
workerID | Optional | String | The id of the worker, part of key pointing to the critiqued grade | Body
reviewerID | Optional | String | The id of the reviewer, part of key pointing to the critiqued grade | Body
criticID | Optional | String | The id of the critic, part of key pointing to the critiqued grade | Body
categoryID | Optional | String | The id of the category, part of key pointing to the critiqued grade | Body
criteriaID | Optional | String | The id of the criteria, part of key pointing to the critiqued grade | Body
state | Optional | Number | The new state of the critiqued grade, either 2 or 3 (accept or reject) | Body

Example Body:
```json5
{
  assignmentID: "0000000000000000000000000000000000000000000000000000000000000002",
  workerID: "0000000000000000000000000000000000000000000000000000000000000001",
  reviewerID: "0000000000000000000000000000000000000000000000000000000000000000",
  criticID: "0000000000000000000000000000000000000000000000000000000000000003",
  categoryID: "0000000000000000000000000000000000000000000000000000000000000000",
  criteriaID: "0000000000000000000000000000000000000000000000000000000000000001",
  state: 2
}  
```

### Responses

#### `Success` 200  - Successfully updated critiqued grades state
##### Response schema
Empty Response

#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
example,
```json5
{
  message: "Invalid authentication token"
}
```

#### `Not Found` 404 - No such critiqued grade exists
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
example,
```json5
{
  message: "No such critiqued grade exists"
}
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
example,
```json5
{
  message: "assignmentID must be of type string"
}
```

## `POST` `/work`
This endpoint is for submitting work.  It allows a user to submit the piece of work associated with the work relation.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by the user | Headers
assignmentID | Required | String | The id of the assignment, part of key pointing to the critiqued grade | Body
workerID | Optional | String | The id of the worker, part of key pointing to the critiqued grade | Body


### Responses

#### `Success` 200  - Successfully uploaded work
##### Response schema
Blob contains requested file

#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
example,
```json5
{
  message: "Invalid authentication token"
}
```

#### `Not Found` 404 - No such work exists
Notably this can also happen when there is a database inconsistency, in such case no message is returned.
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
example,
```json5
{
  message: "No such work exists"
}
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
example,
```json5
{
  message: "The submitted file must be a zip file"
}
```

## `GET` `/work`
This endpoint is for downloading work. It behaves like a regular GET endpoint which returns a file, other than that it
expects a auth token header.  The file that is uploaded must be a zip file.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by the user | Headers
file | Required | Binary | The uploaded file | Blob

### Responses

#### `Success` 200  - Successfully uploaded work
##### Response schema

```
Response {
  assignmentID (String, requried): The id of the assignment 
  workerID (String, requried): the id of the worker
  submissionTime (Number, required):  The unix time stamp of the time at which work was submitted
}
```
example,
```json5
{
  "assignmentID": "0000000000000000000000000000000000000000000000000000000000000003",
  "workerID": "0000000000000000000000000000000000000000000000000000000000000001",
  "submissionTime": 1556665187650
}
```

#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
example,
```json5
{
  message: "Invalid authentication token"
}
```

#### `Not Found` 404 - No such work exists
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
example,
```json5
{
  message: "No such work exists"
}
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
example,
```json5
{
  message: "The submitted file must be a zip file"
}
```