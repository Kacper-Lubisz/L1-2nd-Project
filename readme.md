# Readme

## Usage Guide

The server can be started by using `npm start`, though by default it won't be in a testable state.  The server can start
by preloading one of two datasets `production` or `development`.  The dataset that is used can be changed by passing a 
command line argument, otherwise by default the development dataset is used.  I talk about it more under the 
completeness section, but if the server isn't started with the development set it is otherwise impossible to populate 
the in memory database.

Since Google sign in is used, the dataset **must** be altered to grant whoever is performing testing access!  Google 
login is simply used as a way to verify the users email address and then match it with one of the records in the 
database.  All of the data is stored in the `data.json` file, this file is loaded on startup and is never overwritten
by the server.  To fully test the code (use of Google Calendar API) you must authenticate yourself using your Google 
account.

These are the steps for modifying the database to grant yourself access to the test users data.

**NOTE**, editing will cause **unit tests to fail**, since they rely on the the user data.  Run the unit tests before 
changing the data! 

1. Open the `/config/data.json` file
2. Locate the first user in the development dataset. Accessed in js as `(data.json).development.users[0]`
3. Replace the email address `youremail@address.here` with whichever email address you will use for Google log in
4. Save this file and run the server using `npm start`

Following the method above, you will be get access to the first user, around which the test data is designed.

An alternative method which doesn't allow for all testing is to bypass the authentication by forcing authentication to
be in a test lke mode all the time.  This can be done by changing the export of `authenticate.js` to always return the 
a valid authentication result with the email of the first user.  More instructions are available in `authenticate.js`.  

Of course, the email that is specified here can be changed to access other users, though this is not recommended.

## Cloud deployment

The cloud deployment, can be found at durpeer.tk
It isn't really functional since no users can authenticate, but the same code as the code that is submitted.

## Notes on the technologies used

The main thing that I wanted to make sure was clear was my used of web page history.  Enough though the URL of the page
changes as you navigate the page, the page isn't being reloaded.  This is to provide for a better user experience, 
since for most users it is natural to press their browsers back button when navigating through the various views 
(otherwise this would have navigated to the empty tab, or whatever they had open before).  Importantly this doesn't go
against the requirement of making a single page app.

The other important library that I used was Handlebars.  All of my pages are written in .mustache files which are 
templates for HTML pages.  For the most part I don't think that more of an understanding is needed to read the code and
understand what is happening, but the homepage of handlebars gives a really good introduction.

## Notes on the test data

The main point that I want to make is that the test data was hand crafted and isn't perfectly self consistent.  This is 
to say that data exists in the database which the code would never create because of various constraints.  For example, 
may users have pieces of work that are labeled as submitted (submissionTime !== null) while no work is present, thus the
client will try download work that doesn't exist and get a 404 error.  Another example of how the dataset isn't perfect
is the fact that many time stamps are set to unrealistic values.  For example,  may time stamps are set to 0, which is
the date 00:00:00 01/01/1970.  This for may assignments this may be outside of the submission period.

The test data of course doesn't represent all possible combinations that could be encountered, but does a good job of 
concisely showing many significant scenarios.  Another notable fact is that the test data is designed around the first 
user.  This is to say that the first user will have the most consistent data (though not perfectly) and will also have 
the most variety.

## Notes on the completeness of the project

Here I mean to note that the project is defiantly not in a complete state.  Something I realised too late is that the
scope of this project was defiantly more than was realistic given the time restrictions.  Since I didn't have time to 
make a complete project I focused on creating the experience of the student users, and neglecting the admin user.  This
doesn't only mean that there are no admin pages, but also no APIs implemented that are needed to perform the tasks that 
an admin would need.

The student should never encounter any part of the page that is incomplete (or none functional anyway), if they stick 
to following only onscreen instructions.  (e.g. editing URLs to access assignments, reviews and critiques that are not 
yours, will at show an error for all users, including 'not implemented' error for admin users).

Though, the admin functionality does exist in all APIs that were created (for example, can only access your own reviews 
if not admin).  This wasn't tested extensively, but should be fine and testable through modifying requests that the 
client would already make.

list the things that are implemented and the things that are not

## Future additions to the system

There are a lot of ways in which I could improve this code which I would have done if I had more time, I hope that 
acknowledging some of these possible improvements won't go against my mark:
  * Write object oriented models for Assignments, Reviews and Critiques on the front end
  * Add animations to view transitions
  * Use the built in express validators (discovered them too late)
  * Remove the awful redundancy in the json that is sent over the network
  * Better use of Handlebars helpers (for abstracting of templates)
  * A proof based system for data access, which would improve performance 
  * The id's in the test data are all sequential, which is a potential security threat (ought to be random)
  * Implement better protection against unauthorised accesses (e.g. add delays to prevent timing based searches) 
  * Fix the tooltip bug
  
Unfinished features:
  * User identicons and user display names are  