# API Documentation

## `GET /users`
This endpoint getting the data of a user (admin authentication token required)

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
userID | Required | String | The userID of the user to be fetched | Body

e.g.
Header:
```
token: '{"message":{"userID":"3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  userID: "3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF"
}
```

### Responses

#### `OK` 200 - Successful fetch
##### Response schema
```
User {
  userID (String, required): The id of the user
  username (String, required): The username
  displayName (String, required): The user's displayName
  displayIcon (String, required): The URL to the displayIcon
  password (String, required): The hashed username
  salt (String, required): The hashing salt used
  isAdmin (boolean, required): If the user is an admin
}
```
e.g.
```json5
{
  userID: "3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF",
  username: "admin",
  salt: "high salt levels",
  displayName: "Adjective None",
  displayIcon: "icons/icon1.png",
  password: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
  isAdmin: true
}
```
#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
}
```
#### `Bad Request` 400 - Missing Parameter
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
```json5
{
  message: "No userID provided"
}
```
#### `Not Found` 404 - No such user exists
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
```json5
{
  message: "No such user exists"
}
```

---
 
## `PATCH /users`
This endpoint is for changing information about an already existing user. Password, Display Name, Display Icon and 
isAdmin can be changed.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
userID | Required | String | The users id | Body
password | Optional | String | The new password password | Body
isAdmin | Optional | Boolean | If user is to be an admin | Body

e.g.
Header:
```
token: '{"message":{"userID":"3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  username: "admin",
  password: "plain text password",
  isAdmin: false
}
```

### Responses
#### `OK` 200 - Successful Added
##### Response schema
```
Update {
  user (User, required) The user data after the update 
}
```
e.g.
```json5
{
  userID: "3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF",
  username: "admin",
  salt: "high salt levels",
  displayName: "Adjective None",
  displayIcon: "icons/icon1.png",
  password: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
  isAdmin: true
}
```
#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
}
```
#### `Bad Request` 400 - Missing Parameter
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
```json5
{
  message: "Missing password argument (needed for creating a new user)"
}
```

---

## `PUT /users`
This endpoint is for creating new users (admin authentication token required).  The user's id, displayName, displayIcon 
and salt are generated automatically.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
username | Required | String | The new users username | Body
password | Required | String | The new users password | Body
isAdmin | Optional | Boolean | If user is to be an admin | Body

e.g.
Header:
```
token: '{"message":{"userID":"3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  username: "admin",
  password: "plain text password",
  isAdmin: false
}
```

### Responses
#### `OK` 200 - Successful Added
##### Response schema
```
Update {
  user (User, required) the new user that was added 
}
```
e.g.
```json5
{
  userID: "3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF",
  username: "admin",
  salt: "high salt levels",
  displayName: "Adjective None",
  displayIcon: "icons/icon1.png",
  password: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
  isAdmin: true
}
```
#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
}
```
#### `Bad Request` 400 - Missing Parameter
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
```json5
{
  message: "Missing password argument (needed for creating a new user)"
}
```
#### `Conflict` 409 - User with that username already exists
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
```json5
{
  message: "User with that username already exists"
}
```

---

## `DELETE /users`
This endpoint is for deleting new users (admin authentication token required).

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
userID | Required | String | The userID of the user to be deleted | Body

e.g.
Header:
```
token: '{"message":{"userID":"3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  userID: "3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF"
}
```

### Responses
#### `OK` 200 - Successful authenticated
##### Response schema
Empty Response

#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
}
```

#### `Not Found` 404 - No such user exists
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
```json5
{
  message: "No such user exists"
}
```

---

## `POST /users`
This endpoint is for the client to obtain an authentication token.  The authentication token consists of the message and
the signature.  The message states the permissions that the user has and when the token expires.  The signature is the 
hash of the message and the server's private key.  The signature proves that the server created the message.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
username | Required | String | The username | Body
password | Required | String | The password | Body

e.g.

### Responses
#### `OK` 200 - Successful authenticated
##### Response schema
```
Token {
  message (Message, required): The token message
  signature (String, required): The token signature
  user: (User, required): The userdata for the logged in user
}

Message {
  userID (String, required): The userID that the token is for
  isAdmin (Boolean, required): Whether the token grants admin privilege
  validUntil (Int, required): The expiry date of the token (unix timestamp)
}
```
The User type is defined above.
e.g.
```json5
{
  message: {
      userID: "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
      isAdmin: true,
      validUntil: 1551040494,
  },
  signature: "6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50"
}
```
#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
e.g.
```json5
{
  message: "username parameter was missing"
}
```
#### `Forbidden` 403 - The credential's were invalid
##### Response schema
```
Error {
  message (String, required): String explanation of invalid credentials
}
```
e.g.
```json5
{
  message: "The username and password pair was invalid"
}
```

---

## `GET /assignments` 
for fetching the properties of an assignment, including all the marking categories/criteria.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by a user | Header
assignmentID | Required | String | The assignmentID of the assignment to be fetched | Body

e.g.
Header:
```
token: '{"message":{"userID":"3443437509B8FAA5BA4501EF4E0E68312B67CA2DDB7515A64E9961F632C440AF","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  assignmentID: "CE7A7C10B0DFD96808CCA64C88CF5C5E13B7775283BDC924767887BFA32C8FA1"
}
```

### Responses

#### `OK` 200 - Successful fetch
##### Response schema
```
Assignment {
  assignmentID (String, required): The id of the assignment
  title (String, required): The title of the assignment
  startTime (Number, optional): The start time of the assignment
  markingCategories (MarkingCategory[], required): The marking categories of the assignment
}
MarkingCategory {
  categoryID (String, required): The id of the marking category
  title (String, required): The title of the marking category
  weight (Number, required): The weight of the marking category
  markingCriteria (MarkingCriteria[], required): The list of marking criteria for the category
}
MarkingCriteria {
  criteriaID (String, required): The id of the marking criteria
  weight (Number, required): The weight of the criteria in the category
  subtitle (String, required): The title of the criteria
  description (String, required): The description of how marks should be awarded for this criteria
}
```
e.g.
```json5
{
  assignmentID: "CE7A7C10B0DFD96808CCA64C88CF5C5E13B7775283BDC924767887BFA32C8FA1",
  title: "p5 Programming Summative",
  markingCategories: [
    {
	  categoryID: "0C24A9363AEEAE73156824D1218137774BE59AE3962FE8A93DEB4A664835E3EB",
	  title: "Code Quality",
	  weight: 1,
	  markingCriteria: [
	    {
		  criteriaID: "6E3A6F9E9947021031D8864CA2758613F8589CCDFE59C93FCF8A0330B92B2521",
		  weight: 1,
		  subtitle: "ESLint",
		  description: "Marks in this category are awarded based on the number and type of warnings that ESLint gives when for the code. e.g. ..."
		},
		{
		  criteriaID: "7E744141B40EA5501412E42C8B40FD0B05F1608AA2E4073944CCCCBD82F24EE8",
		  weight: 1,
		  subtitle: "Style",
		  description: "Marks in this category are awarded based on quality of the code style.  Since there isn't an official style guide, this should be judged on the style consistency and general readability. e.g. ..."
		}
	  ]
	},
	{
	  categoryID: "B60D3D892BABF62B41E522791E9187D3D4600133011A5C76FE7C5505C8511AA2",
	  title: "Documentation Quality",
	  weight: 1,
	  markingCriteria: []
	},
  ]  
}
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
e.g.
```json5
{
  message: "assignmentID parameter was missing"
}
```

#### `Forbidden` 403 - The credential's were invalid
##### Response schema
```
Error {
  message (String, required): String explanation of invalid credentials
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
}
```

---

## `PUT /assignments`
This endpoint is for creating a new assignment. Note that this doesn't need to contain all information to complete the 
assignment.  This is the first call which creates the instance of the assignment in the database so that it can be 
updated through calls to put.  This should only be called once per assignment, otherwise PATCH should be used.  The 
startTime can only be set if the assignment is complete.  An assignment is field if none of the objects are missing any 
fields. This requires admin privilege.

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
assignment | Optional | NewAssignment (see below) | The data to instantiate the assignment with (otherwise use PATCH) | Body

Parameter schemas:
```
NewAssignment {
  title (String, optional): The title of the assignment
  startTime (Number, optional): The start time of the assignment
  markingCategories (MarkingCategory[], optional): The marking categories of the assignment
}
NewMarkingCategory {
  title (String, optional): The title of the marking category
  weight (Number, optional): The weight of the marking category
  markingCriteria (MarkingCriteria[], optional): The list of marking criteria for the category
}
NewMarkingCriteria {
  weight (Number, optional): The weight of the criteria in the category
  subtitle (String, optional): The title of the criteria
  description (String, optional): The description of how marks should be awarded for this criteria
}
```
The 'New' variants of these schemas are just like the original ones except they don't contain IDs since they are 
assigned when the data is added to the database.  The new variants also have most of their fields optional

e.g.
Header:
```
token: '{"message":{"userID":"3443437509b8faa5ba4501ef4e0e68312b67ca2ddb7515a64e9961f632c440af","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  assignment: {
	title: "p5 Programming Summative",
	markingCategories: [
	  {
		title: "Code Quality",
		weight: 1,
		markingCriteria: [
		  {
			weight: 1,
			subtitle: "ESLint",
			description: "Marks in this category are awarded based on the number and type of warnings that ESLint gives when for the code. e.g. ..."
		  },
		  {
			weight: 1,
			subtitle: "Style",
			description: "Marks in this category are awarded based on quality of the code style.  Since there isn't an official style guide, this should be judged on the style consistency and general readability. e.g. ..."
		  }
		]
      },
      {
		title: "Documentation Quality",
		weight: 1,
		markingCriteria: []
	  },
	]
  }  
}
```

### Responses

#### `OK` 200 - Successfully added, return data with IDs
##### Response schema
Assignment (see `GET /assignments`)
e.g.
```json5
{
  assignmentID: "ce7a7c10b0dfd96808cca64c88cf5c5e13b7775283bdc924767887bfa32c8fa1",
  title: "p5 Programming Summative",
  markingCategories: [
    {
	  categoryID: "0c24a9363aeeae73156824d1218137774be59ae3962fe8a93deb4a664835e3eb",
	  title: "Code Quality",
	  weight: 1,
	  markingCriteria: [
	    {
		  criteriaID: "6E3A6F9E9947021031D8864CA2758613F8589CCDFE59C93FCF8A0330B92B2521",
		  weight: 1,
		  subtitle: "ESLint",
		  description: "Marks in this category are awarded based on the number and type of warnings that ESLint gives when for the code. e.g. ..."
		},
		{
		  criteriaID: "7e744141b40ea5501412e42c8b40fd0b05f1608aa2e4073944ccccbd82f24ee8",
		  weight: 1,
		  subtitle: "Style",
		  description: "Marks in this category are awarded based on quality of the code style.  Since there isn't an official style guide, this should be judged on the style consistency and general readability. e.g. ..."
		}
	  ]
	},
	{
	  categoryID: "b60d3d892babf62b41e522791e9187d3d4600133011a5c76fe7c5505c8511aa2",
	  title: "Documentation Quality",
	  weight: 1,
	  markingCriteria: []
	},
  ]  
}
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
e.g.
```json5
{
  message: "Can't set the startTime for an incomplete assignment"
}
```

#### `Forbidden` 403 - The credential's were invalid
##### Response schema
```
Error {
  message (String, required): String explanation of invalid credentials
}
```
e.g.
```json5
{
  message: "Invalid/Insufficient authentication token"
}
```

---

## `PATCH /assignments`
This endpoint is for updating an already existing assignment. An assignment can only be edited until it is published 
(has a startTime).

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
assignment | Optional | Assignment (see above) | The data to instantiate the assignment with (otherwise use PATCH) | Body

The schema for the assignment is actually a mix of Assignment and NewAssignment.  Any categories and criteria that don't
already have an id need to be submitted as New.  These can be mixed in the same arrays.  An entry with an id will update
an existing entry whereas one without will always be added as new.

e.g.
Header:
```
token: '{"message":{"userID":"3443437509b8faa5ba4501ef4e0e68312b67ca2ddb7515a64e9961f632c440af","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  assignment: {
    assignmentID: "ce7a7c10b0dfd96808cca64c88cf5c5e13b7775283bdc924767887bfa32c8fa1",
	title: "p5 Programming Summative",
	startTime: null, 
	markingCategories: [
	  {
	    categoryID: "0c24a9363aeeae73156824d1218137774be59ae3962fe8a93deb4a664835e3eb",
		title: "Code Quality",
		weight: 1,
		markingCriteria: [
		  {
			weight: 1,
			subtitle: "Efficiency",
			description: "Marks in this category are awarded the algorithms used, if there are examples of needlessly slow code the mark should be lowered."
		  }
		]
      },
      {
		title: "Development of Original",
		weight: 1,
		markingCriteria: []
	  }
	]
  }  
}
```

### Responses

#### `OK` 200 - Successfully updated, return data with IDs
##### Response schema
Assignment (see `GET /assignments`)
e.g.
```json5
{
  assignmentID: "ce7a7c10b0dfd96808cca64c88cf5c5e13b7775283bdc924767887bfa32c8fa1",
  title: "p5 Programming Summative",
  markingCategories: [
    {
	  categoryID: "0c24a9363aeeae73156824d1218137774be59ae3962fe8a93deb4a664835e3eb",
	  title: "Code Quality",
	  weight: 1,
	  markingCriteria: [
	    {
		  criteriaID: "6e3a6f9e9947021031d8864ca2758613f8589ccdfe59c93fcf8a0330b92b2521",
		  weight: 1,
		  subtitle: "ESLint",
		  description: "Marks in this category are awarded based on the number and type of warnings that ESLint gives when for the code. e.g. ..."
		},
		{
		  criteriaID: "7e744141b40ea5501412e42c8b40fd0b05f1608aa2e4073944ccccbd82f24ee8",
		  weight: 1,
		  subtitle: "Style",
		  description: "Marks in this category are awarded based on quality of the code style.  Since there isn't an official style guide, this should be judged on the style consistency and general readability. e.g. ..."
		},
		{
		  weight: 1,
		  subtitle: "Efficiency",
		  description: "Marks in this category are awarded the algorithms used, if there are examples of needlessly slow code the mark should be lowered."
		}
	  ]
	},
	{
	  categoryID: "b60d3d892babf62b41e522791e9187d3d4600133011a5c76fe7c5505c8511aa2",
	  title: "Documentation Quality",
	  weight: 1,
	  markingCriteria: []
	},
	{
	  title: "Development of Original",
	  weight: 1,
	  markingCriteria: []
	}
  ]  
}
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
e.g.
```json5
{
  message: "Can't set the startTime for an incomplete assignment"
}
```

#### `Not Found` 404 - The request made reference to something that can't be found
For example, if the markingCriteriaID that is given doesn't exist,  this is an erroneous request.
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
e.g.
```json5
{
  message: "MarkingCriteria with criteriaID='dba36bffa5cab0f922d087a3aeb179f9d4e745df40b323e1b1471402848c8a3e' doesn't exist"
}
```

#### `Forbidden` 403 - The credential's were invalid
##### Response schema
```
Error {
  message (String, required): String explanation of invalid credentials
}
```
e.g.
```json5
{
  message: "Invalid/Insufficient authentication token"
}
```

---

## `GET /reviews`
This endpoint is used for getting reviews and critiques.  There are different ways to select reviews when using this 
endpoint:
  * By user, all the reviews/critiques started by a particular user (authentication token required, admin if not for self)
  * By work, all the reviews/critiques on a piece of work (authentication token required, admin if not yours, admin if the 
        review isn't submitted)
  * By id, the particular review/critique (authentication token required, admin if not your review or of your work)
  * By nothing, returns all the reviews and critiques (admin authentication token required)

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

Parameter schemas:
```
{
  userID (String, optional): The ID of the user who's work is to be fetched
  work (WorkID, optional): The composite key of the piece of work to have reviews fetched 
  review (ReviewID, optional): The composite key of a particular review to be fetched
}

WorkID {
  assignmentID (String, required): The assignment ID part of the composite key
  userID (String, required): The user ID part of the composite key
}

ReviewID {
  assignmentID (String, required): Part of the composite key that identifies the work being reviewed
  userID (String, required): Part of the composite key that identifies the work being reviewed
  reviewerID (String, required): The key that identifies the author of the review
}
```

e.g.
Header:
```
token: '{"message":{"userID":"3443437509b8faa5ba4501ef4e0e68312b67ca2ddb7515a64e9961f632c440af","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```

Body:
```json5
{
  userID: "83566c4039f629d0f95b2e3a9e4306fa15873c898a76117a21a667950b49ba8e",
  work: {
    "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
    "userID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b"
  },
  review: {
    "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
    "userID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
    "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
  }  
}
```

The three selection types specified by the parameters can be used in the same request, to select all as admin simply 
leave all these fields blank.

### Responses

#### `OK` 200 - Successfully fetch
##### Response schema
```
Response {
  user: (Review[], Optional )
  work: (Review[], Optional)
  review:(Review, Optional)  
}

Review {
  assignmentID (String, required): Part of the composite key that identifies the work being reviewed
  userID (String, required): Part of the composite key that identifies the work being reviewed
  reviewerID (String, required): The key that identifies the author of the review
  comment (String, required): The comment left by the reviewer
  isComplete (Boolean, required): If the review has been submitted
  grades (Grade[], required): The grades associated with the review
  critiques (Critique[], required): The critiques associated with the review
}

Grade {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade)
  ownerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade) 
  reviewerID (String, required): The id of the reviewer who left the review
  criteriaID (String, required): The id of the criteria that is being graded
  mark (Number, required): The mark given to the piece of work in the specific criteria
  comment (String, required): Explanation of the mark
}

Critique {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued)
  ownerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued) 
  reviewerID (String, required): The id of the reviewer who left the review (ideintifyies)
  criticID (String, required): The id of the user that started the critque
  comment (String, required): The general explanation for critique
  isComplete (boolean, required): If the critique has been completed
  grades (CritiquedGrade[], required): The list of grades that the critique desires to alter  
}

CritiquedGrade {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued)
  ownerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued) 
  reviewerID (String, required): The id of the reviewer who left the review (ideintifyies)
  criticID (String, required): The id of the user that started the critque
  criteriaID (String, required): Thd id of the critteria that is to be altered
  proposedMark (Number, required): The mark proposed by the critique,
  comment (String, required): The exaplantion of the critiqued mark
  state (Number, required): The state of the critiqued grade (Proposed, Accepted, Rejected)
}

```

e.g.
```json5
{
  user:[
    {
      "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
      "userID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
      "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
      "comment": "generally poor, do more work",
      "isComplete": true,
      "grades": [
        {
          "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
          "ownerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
          "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
          "criteriaID": "04a7693c82490b9d79e528f4499eaaf3b16ae1e095d082b2319099ecd3e8de97",
          "mark": 0.20,
          "comment": "legit 20 serious warnings and 100 minor ones, no effort"
        }
      ],
      "critiques": [
        {
          "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
          "ownerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
          "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
          "criticID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
          "comment": "Poor review",
          "isComplete": false,
          "grades": [
            {
              "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
              "ownerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
              "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
              "criticID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
              "criteriaID": "04a7693c82490b9d79e528f4499eaaf3b16ae1e095d082b2319099ecd3e8de97",
              "proposedMark": 0.0,
              "comment": "with all those warnings he deserves nothing, no effort!",
              "state": 1
            }
          ]  
        }
      ]       
    }  
  ],
  work:[
    {
      "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
      "userID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
      "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
      "comment": "generally poor, do more work",
      "isComplete": true,
      "grades": [],
      "critiques": []
    }
  ],
  review: {
    "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
    "userID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
    "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
    "comment": "generally poor, do more work",
    "isComplete": true,
    "grades": [],
    "critiques": []
  }
}  
```

#### `Bad Request` 400 - The request was invalid
##### Response schema
```
Error {
  message (String, optional): Explanation of the error
}
```
e.g.
```json5
{
  message: "Reviews of your own work are not avaiable until reviewing is over"
}
```

#### `Forbidden` 403 - The credential's were invalid/insufficient
##### Response schema
```
Error {
  message (String, required): String explanation of invalid credentials
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
}
```

---

## `POST /reviews`
This endpoint is for creating new reviews and critiques.  It only returns the ID's of the review or critique that has 
just been created.  
  * When a new review is made, the information about the work being reviewed is returned.
  * When a critique is made, the information about the work and review are returned. 

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by a user | Header
isCritique | Required | Boolean | Whether a critique or a review is being create | Body

e.g.
Header:
```
token: '{"message":{"userID":"3443437509b8faa5ba4501ef4e0e68312b67ca2ddb7515a64e9961f632c440af","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```

### Responses

#### `Created` 201  - Successfully created new review
##### Response schema

```
Response {
  work (Work, required): The piece of work that the review is about
  review (Review, required): The new review or existing review to be critiqued
  critique (Critique, optional): The critique that might have been created 
}

Review {
  assignmentID (String, required): Part of the composite key that identifies the work being reviewed
  userID (String, required): Part of the composite key that identifies the work being reviewed
  reviewerID (String, required): The key that identifies the author of the review
  comment (String, optional): The comment on the review, if the review is new this is missing
  isComplete (boolean, optional): if the review is complete, if the review is new this is missing
  grades (Grade[], optional): The grades associated with the review
}
  
Grade {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade)
  ownerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade) 
  reviewerID (String, required): The id of the reviewer who left the review
  criteriaID (String, required): The id of the criteria that is being graded
  mark (Number, required): The mark given to the piece of work in the specific criteria
  comment (String, required): Explanation of the mark 
}

Critique {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued)
  ownerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade being critiqued) 
  reviewerID (String, required): The id of the reviewer who left the review (ideintifyies)
  criticID (String, required): The id of the user that started the critque 
}

```

e.g.

```json5
Response {  
  "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
  "userID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
  "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
}
```

#### `Forbidden` 403 - The credential's were invalid/insufficient
##### Response schema
```
Error {
  message (String, required): String explanation of invalid credentials
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
}
```

#### `Not Found` 404 - No more work to review
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
```json5
{
  message: "Can't assign more work to review"
}
```

---

## `PUT /reviews`
This endpoint is for both updating reviews and critiques.  This means that depending the endpoint has different 
authentication behaviours and expects different parameters based on which use case is being used. (authentication token required, review must be the users)

### Parameters

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by the user | Headers
review | Required | Review | The content that is to be updated | Body

Parameter Schema:

```
Review {
  assignmentID (String, required): Part of the composite key that identifies the work being reviewed
  userID (String, required): Part of the composite key that identifies the work being reviewed
  reviewerID (String, required): The key that identifies the author of the review
  comment (String, required): The comment left by the reviewer
  isComplete (Boolean, required): If the review has been submitted
  grades (Grade[], optional): The grades associated with the review
}

Grade {
  assignmentID (String, required): Part of the composite key to identify the piece of work (which identifies the grade)
  ownerID (String, required): Part of the composite key to identify the piece of work (which identifies the grade) 
  reviewerID (String, required): The id of the reviewer who left the review
  criteriaID (String, required): The id of the criteria that is being graded
  mark (Number, required): The mark given to the piece of work in the specific criteria
  comment (String, required): Explanation of the mark
}
```

e.g.
Header:
```
token: '{"message":{"userID":"3443437509b8faa5ba4501ef4e0e68312b67ca2ddb7515a64e9961f632c440af","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```
{
  "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
  "userID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
  "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
  "comment": "generally poor, do more work",
  "isComplete": true,
  "grades": [
    {
      "assignmentID": "5fb2054478353fd8d514056d1745b3a9eef066deadda4b90967af7ca65ce6505",
      "ownerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
      "reviewerID": "651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b",
      "criteriaID": "04a7693c82490b9d79e528f4499eaaf3b16ae1e095d082b2319099ecd3e8de97",
      "mark": 0.20,
      "comment": "legit 20 serious warnings and 100 minor ones, no effort"
    }
  ]      
}  
```

### Responses

#### `Success` 200  - Successfully updated review
##### Response schema
Empty Response

#### `Forbidden` 403 - Invalid authentication token / Insufficient Permissions
##### Response schema
```
Error {
  message (String, required): String explanation of invalid authentication token
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
}
```

#### `Not Found` 404 - Nothing to fetch
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
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
e.g.
```json5
{
  message: "Review can't be marked as complete until all criteria are reviewed"
}
```

---