# Readme

## Usage Guide

The server can be started by using `npm start`, though by default it won't be in a testable state.
The server can start by preloading one of two datasets `production` or `development`.
The dataset that is used can be changed by passing a command line argument, otherwise by default the development dataset is used.
I talk about it more under the completeness section, but if the server isn't started with the development set it is otherwise impossible to populate the in memory database.

Since Google sign in is used, the dataset *must* be altered to grant whoever is performing testing access!  
Google login is simply used as a way to verify the users email address and then match it with one of the records in the database.
All of the data is stored in the `data.json` file, this file is loaded on startup and is never overwritten by the server.
To fully test the code (use of Google Calendar API) you must authenticate yourself using your Google account.

These are the steps for modifying the database to grant yourself access to the test users data.

1. Open the `/config/data.json` file
2. Locate the first user in the development dataset. Accessed in js as `(data.json).development.users[0]`
3. Replace the email address `youremail@address.here` with whichever email address you will use for Google log in
4. Save this file and run the server usign `npm start`

Following the method above, you will be get access to the first user, around which the test data is designed.

A worse alternative if you don't want to use a Google account for testing is to completly bypass authentication.
This option is only included if you don't want to use a Google account.
Of course, the Google sign in window will show you exactly what access the code is being granted, and to log in it is only basic account information.
Bypassing authentication will allow for accessing data but could (and will) break the servers core functionality.
These are the steps to bypassing authentication

1. Open the `/authentication.js` file
2. Insert a return statment payload (shown below) at the top of the verify function to force it to always return a valid authentication.
3. Save this file and run the server usign `npm start`

This is the payload for bypassing authentication:
```
return {
	email:"youremail@address.here"
}
```
Of course, the email that is specified here can be changed to access other users, though this is not reccomended.

## Notes on the test data

The main point that I want to make is that the test data was hand crafted and isn't perfectly self consistant.
This is to say that data exists in the database which the code would never create because of various constraints.
For example, may users have pieces of work that are labeled as submitted (submissionTime !== null) while no work is present
, thus the client will try download work that doesn't exist and get a 404 error.
Another example of how the dataset isn't perfect is the fact that many time stamps are set to unrealisitic values.  For example,
may time stamps are set to 0, which is the date 00:00:00 01/01/1970.  This for may assignments this may be outside of the submission period.

The test data of course doesn't represent all possible combinations that could be encountered, 
but does a good job of conciesly showing many significant scenarions.
Another notable fact is that the test data is designed around the first user.  
This is to say that the first user will have the most consistent data (though not perfectly) and will also have the most variety.

## Notes on the completeness of the project

Here I mean to note that the project is definatly not in a complete state.  
Something I realised too late is that the scope of this project was definatly more than was realistic given the time restrictions.
Since I didn't have time to make a complete project I focused on creating the experience of the student users, and neglecting the admin user.
This doesn't only mean that there are no admin pages, but also no APIs implemented that are needed to perform the tasks that an admin would need.

The student should never encounter any part of the page that is incomplete (or none functional anyway), if they stick to following only onscreen instructions.
(e.g. editing URLs to access assignments, reviews and critiques that are not yours, will at show an error for all users, including 'not implemented' error for admin users).

Though, the admin functionality does exist in all APIs that were created (for example, can only access your own reviews if not admin).
This wasn't tested extensivly, but should be fine and testable through modifying requests that the client would already make.

