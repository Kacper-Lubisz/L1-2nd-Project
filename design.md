# Design
In this file I'm going to talk a bit about the design process that went into making this project.

## Proposition
The proposed project is to make a peer review software, much like that used by Steven for reviewing the first 
programming summative.  The minimum viable product would be to essentially recreate the existing system, though the goal
is to make a more sophisticated system.

Gonna' name it DurPeer, *Durham + Peer Review = DurPeer*

## Goals

These are the very general goals for the project:
* Allow for users to dispute reviews
* Increase the sample sample sizes
* Give important charts and statistics (admin and users)

## Features

This section is an overview of the features and their justifications, this is all subject to change during the 
implementation process.

Features:
* An arbitrary amount of reviews can be made
    * With diminishing returns this will increase the peer review mark that the reviewer gets.
    * This will likely lead to a large number of reviews
* An arbitrary amount of critiques can be made
    * A critique is the review of a peer review
    * A reviewer will need to do a balance of reviews and critiques to make sure they get a good peer review mark
    * When a critique is received, the original author of the review will have time to accept or reject the review. The
    result of this decision will impact the reputations of both reviewers. 
* Each reviewer has a reputation (extension)
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

## Screen Management System

Instead of using a framework I want to make my own implementation of a screen management system.  The main goal being 
the abstraction of the screen replacement process.

The system will have two types of object.  Views and the view manager (singleton).  Views will encapsulate the behaviour
of each screen, while the view manager will encapsulate the behaviours needed to instantiate and change views.

## ER Modeling
I will model all the entities in my system as though it were an database, since if this system were to be deployed it 
would need to.  It would be much easier to store this data in a nested json file format, but I will store the data using
json in tables that are linked by keys for the purpose of making the project closer to a real deployable system.

The main downside with this implementation is the performance consideration of linking these tables.  Of course, in a 
real system, a DBMS would manage this.  DBMS software is optimised for this sort of thing and will certainly run much
faster than an implementation that I could come up with.

Originally I listed out all of the entities here, which I have instead moved into the `database.js` file, to remove 
redundancy.

## API documentation

### Endpoint Overview

A complete API documentation can be found in apidocs.md, this is an overview

This is the list of all the endpoints:
* `/users` for managing the users
    * `GET` for getting user data (authentication token required).
    * `PUT` for adding users and changing properties (this is only to be accessed by the administrator).
    * `DELETE` for deleting users(this is only to be accessed by the administrator).
    
* `/assignments` for creating a new assignment
    * `GET` for fetching the properties of an assignment, including all the marking criteria (authentication token 
    required).
    * `PUT` for creating a new assignment, this also creates user data and marking categories and criteria.  This can be
     done with multiple calls to the API to allow for saving progress (requires admin authentication).

* `/reviews` This endpoint is for creating, fetching and updating: reviews and critiques
    * `GET` this two different ways of selecting reviews and critiques:
      * By owner, will return all work reviews, all own reviews and own critiques.
      * By nothing (select all), this is admin only and returns the whole data base.
    * `POST` allows a user to start working on a new review or critique (creates an empty one) 
        (authentication token required)
    * `PUT` updates a review (authentication token required, review must be the users)
    
* /