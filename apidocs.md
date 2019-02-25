# API Documentation

## `GET /users`
This endpoint getting the data of a user (admin authentication token required)

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
username | Required | String | The username of the user to be fetched | Body

e.g.
Header:
```http request
token: '{"message":{"username":"admin","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  username: "admin"
}
```

### Responses

#### `OK` 200 - Successful fetch
##### Response schema
```
User {
  username (String, required): The username repeated
  password (String, required): The hashed username
  salt (String, required): The hashing salt used
  isAdmin (boolean, required): If the user is an admin
}
```
e.g.
```json5
{
  username: "admin",
  salt: "high salt levels",
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
### `Bad Request` 400 - Missing Parameter
##### Response schema
```
Error {
  message (String, required): String explanation
}
```
e.g.
```json5
{
  message: "No username provided"
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
 
## `PUT /users`
This endpoint is for creating new users (admin authentication token required)

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
username | Required | String | The new users username | Body
password | Optional | String | The new users password | Body
isAdmin | Optional | Boolean | If said user is to be an admin | Body

e.g.
Header:
```http request
token: '{"message":{"username":"admin","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  username: "admin",
  isAdmin: false  
}
```

### Responses
#### `OK` 200 - Successful Added
##### Response schema
```
Update {
  newUser (Boolean, required) if the user is new or updated
  properties (String[], required) list of properties that were updated (or added) 
}
```
e.g.
```json5
{
  message: "Invalid authentication token"
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
### `Bad Request` 400 - Missing Parameter
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
## `DELETE /users`
This endpoint is for deleting new users (admin authentication token required).

Parameter | Value | Data Type | Description | Parameter Type
---|---|---|---|---
token | Required | Token | Proves that the request is made by an admin | Header
username | Required | String | The username of the user to be deleted | Body

e.g.
Header:
```http request
token: '{"message":{"username":"admin","validUntil":1551133265883,"isAdmin":true},"signature":"0dc9e3fb931d4fb512a6547e2311b4a6c9233ca9676ae411d9db1ebb8663c323"}'
```
Body:
```json5
{
  username: "somename"
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
Username | Required | String | The username | Body
Password | Required | String | The password | Body

e.g.

### Responses
#### `OK` 200 - Successful authenticated
##### Response schema
```
Token {
  message (Message, required): The token message
  signature (String, required): The token signature
}

Message {
  username (String, required): The username that the token is for
  isAdmin (Boolean, required): Whether the token grants admin privilege
  validUntil (Int, required): The expiry date of the token (unix timestamp)
}
```
e.g.
```json5
{
  message: {
      username: "username",
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


## `GET /assignments` 
for fetching the properties of an assignment, including all the marking criteria (authentication token
required).

## `PUT /assignments`
for creating a new assignment, this also creates user data and marking categories and criteria.  This 
can be done with multiple calls to the API to allow for saving progress (requires admin authentication).

## `GET /notifications`
computes and returns a list of things that needs attention (critiques that haven't been addressed) 
for that particular user (authentication token required).

## `GET /reviews`
this has different uses 
        * returns all the reviews that a user has started (authentication token required, admin if not for self)
        * returns all the reviews on a piece of work (authentication token required, admin if not yours, admin if the 
        review isn't submitted)
        * returns the contents of a particular review (authentication token required, admin if not your review or of 
        your work)

## `POST /reviews`
allows a user to start working on a new review (authentication token required)

## `PUT /reviews`
updates a review (authentication token required, review must be the users)

## `GET /critiques`
 this has different uses 
        * returns all the critiques that a user has started (authentication token required, admin if not for self)
        * returns all the critiques of a review (authentication token required, admin if not your review, admin if 
        critique isn't submitted)
        * returns the contents of a particular critique (authentication token required, admin if not your critique or of 
        your review)

## `POST /critiques`
allows a user to start working on a new critique (authentication token required)

## `PUT /critiques`
updates a critique (authentication token required, review must be the users)