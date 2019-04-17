class AboutView {
}

/**
 * This class is used for managing templates. It manages loading them, templating and then displaying them
 */
class ViewManager {

    constructor() {
        this.viewStack = [];
        this.isPushing = false;
        this.isPopping = false;

        // update the navbar with user details

        this.signOutButton = $("#signOutButton");
        this.signInButton = $("#signInButton");

        this.userDetailsDiv = $("#userDetails");
        this.username = $("#username");
        this.userIcon = $("#userIcon");

        this.signOutButton.click(async () => {
            const auth2 = gapi.auth2.getAuthInstance();
            await auth2.signOut();
            console.log('User signed out.');
        });

        const manager = this;
        gapi.load('client:auth2', async function () {
            await new Promise(function (resolve) {
                gapi.client.init({
                    client_id: '491064171495-35kum91vn1gd6mkil5ve3h82fph9a5pa.apps.googleusercontent.com',
                    apiKey: "AIzaSyCu90pfiOTnhZxHMKVHogqzlsk_W29gTac",
                    scope: 'profile',
                    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
                }).then(() => resolve());
            });

            const auth = gapi.auth2.getAuthInstance();

            auth.isSignedIn.listen(function (loggedIn) {
                if (loggedIn) {
                    manager.onSignIn();
                } else {
                    manager.onSignOut();
                }
            });

            if (auth.isSignedIn.get()) {
                const userData = await manager.onSignIn();
                manager.pushView(new HomeView(userData));
            } else {
                manager.pushView(new AboutView());
            }
        });


    }

    async onSignOut() {

        this.signOutButton.hide();
        this.userDetailsDiv.hide();
        this.username.text("");
        this.userIcon.attr("src", "");

        this.signInButton.show();

        const currentView = this.viewStack[this.viewStack.length - 1];
        if (currentView !== undefined) {
            currentView.onSignOut();
        }

    }

    async onSignIn() {

        const auth = gapi.auth2.getAuthInstance();
        const googleUser = auth.currentUser.get();

        this.signInButton.hide();
        this.signOutButton.show();

        this.userDetailsDiv.show();

        const profile = googleUser.getBasicProfile();
        // console.log(profile);
        // console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
        // console.log('Name: ' + profile.getName());
        // console.log('Image URL: ' + profile.getImageUrl());
        // console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

        const userDataRequest = await fetch(`/users?email=${encodeURI(profile.getEmail())}`, {
            headers: {
                token: googleUser.getAuthResponse().id_token
            }
        });
        this.userData = await userDataRequest.json();

        this.username.text(`${this.userData.displayName} (${profile.getGivenName()}${
            this.userData.isAdmin ? ", Admin" : ""
            })`);
        this.userIcon.attr("src", "/" + this.userData.identicon);

        const currentView = this.viewStack[this.viewStack.length - 1];
        if (currentView !== undefined) {
            currentView.onSignIn(auth);
        }
        return this.userData;
    }

    pushView(nextView) {
        if (this.isPopping) {
            throw Error("Can't push views while a pop is happening");
        }
        this.isPushing = true;

        if (this.viewStack.length !== 0) {
            this.viewStack[this.viewStack.length - 1].onPause();
        }

        if (!Array.isArray(nextView)) {
            nextView = [nextView];
        }

        for (let view of nextView) {
            if (!(view instanceof View)) {
                throw Error("Can only push objects of type view");
            }
            this.viewStack.push(view);
            view.manager = this;
            view.onCreate();
        }
        if (this.viewStack[this.viewStack.length - 1] === nextView[nextView.length - 1]) {
            // this is to take care of the case where views are pushed from inside onCreate
            nextView[nextView.length - 1].onResume();
        }

        this.isPushing = false;
    }

    popView(number = 1) {
        if (this.isPushing) {
            throw Error("Can't pop views while a push is happening");
        }
        this.isPopping = true;

        if (number > this.viewStack.length - 1) {
            throw Error("Can't pop the home view");
        }

        this.viewStack[this.viewStack.length - 1].onPause();
        for (let i = 0; i < number; i++) {
            const top = this.viewStack.pop();
            top.onDestroy();
            top.dispose();
        }
        this.viewStack[this.viewStack.length - 1].onResume();

        this.isPopping = false;
    }

    popThenPush(popNumber, viewToPush) {

    }

}

/**
 * @abstract
 */
class View {
    constructor(templateLocation) {
        this.templateLocation = templateLocation;
        this.template = undefined;
        this.pageID = undefined;

        if (View.currentPage === undefined) {
            View.currentPage = 0;
            View.pageTemplate = Handlebars.compile('<div id="page{{id}}" class="page collapse">{{{content}}}</div>');
        }

    }

    /**
     * This function is the Handlebars templating function
     * @callback Template
     * @param {Object} The map that contains all the variables needed for templating
     * @return {String} The templated HTML
     */

    /**
     * This method returns the Handlebars template function, it will lazily perform a fetch
     * @return {Promise<Template>}
     */
    async getTemplate() {
        if (this.template === undefined) {
            try {
                const fetchedTemplate = await fetch(this.templateLocation);
                if (fetchedTemplate.status === 200) {
                    this.template = Handlebars.compile(await fetchedTemplate.text());
                    return this.template;
                } else {
                    console.error("TODO error handler");
                    // TODO implement some sort of unified error message for server disconnects
                }
            } catch (e) {
                console.error("TODO error handler");
                // TODO implement some sort of unified error message for server disconnects
            }
        } else {
            return this.template;
        }

    }

    /**
     * @abstract
     */
    async getTemplateContext() {

    }

    async pushToContent(html) {

        if (this.pageID !== undefined) { // re template existing page

            const currentPage = $(`#page${this.pageID}`);
            currentPage.html(html);

            const animationFinish = new Promise(function (resolve, reject) {
                currentPage.on("shown.bs.collapse", function () {
                    resolve();
                });
            });

            currentPage.collapse("show");
            await animationFinish;

        } else {

            this.pageID = ++View.currentPage;
            let currentPage = $(`#page${this.pageID}`);

            const content = $("#content");

            if (currentPage.length === 0) {
                content.prepend(View.pageTemplate({
                    id: View.currentPage,
                    content: html
                }));
                currentPage = $(`#page${View.currentPage}`);
            } else {
                currentPage.html(html);
            }

            // if (dontAnimate) {
            //     $(".show").attr("style", "transition: 0s");
            //     currentPage.attr("style", "transition: 0s");
            // } else {
            //     $(".show").attr("style", "");
            //     currentPage.attr("style", "");
            // }

            $(".page.show").collapse("hide");

            const animationFinish = new Promise(function (resolve, reject) {
                currentPage.on("shown.bs.collapse", function () {
                    resolve();
                });
            });

            currentPage.collapse("show");
            await animationFinish;

        }

        return this.pageID;
    }

    /**
     * @abstract
     */
    onCreate() {
        this.getTemplate();
    }

    /**
     * @abstract
     */
    onResume() {

    }

    async templateAndPushPage() {

        const [newTemplate, templatingContext] = await Promise.all([
            this.getTemplate(),
            this.getTemplateContext()
        ]);
        // fetching of the template and fetching the information needed to fill it are done in parallel

        return this.pushToContent(newTemplate(templatingContext));
    }

    /**
     * @abstract
     */
    onPause() {

    }

    /**
     * @abstract
     */
    onDestroy() {

    }

    /**
     * @abstract
     */
    onSignIn() {

    }

    /**
     * @abstract
     */
    onSignOut() {

    }

    /**
     * @final
     */
    dispose() {

        View.currentPage = this.pageID - 1;
        $(`.show.page`).collapse("hide");
        // it doesn't need to be removed since the contents can be replaced later

    }

}

class ReviewView {
    constructor(userData, attr) {

    }

}

class HomeView extends View {
    constructor(userData) {
        super("/templates/home.mustache");

        this.userData = userData;
    }

    async getTemplateContext() {
        const assignmentDataPromise = fetch(`/assignments?workerID=${encodeURI(this.userData.userID)}`, {
            headers: {token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token}
        }).then((response) => response.json());

        const reviewDataPromise = fetch(`/reviews?ownerID=${encodeURI(this.userData.userID)}`, {
            headers: {token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token}
        }).then((response) => response.json());

        const [assignmentData, reviewsData] = await Promise.all([assignmentDataPromise, reviewDataPromise]);
        // TODO catch exceptions here

        const assignmentsMap = {};
        this.userData.assignments = assignmentData.map((assignment) => {
            assignment.badges = HomeView.getAssignmentBadges(assignment);
            assignmentsMap[assignment.assignmentID] = assignment;
            return assignment;
        });

        this.userData.reviews = reviewsData.reviewer;
        this.userData.critiques = reviewsData.critic;
        reviewsData.worker.forEach((review) => {
            // these are the reviews of your work
            // they are stored with the assignments

            const assignment = assignmentsMap[review.assignmentID];

            if (assignment === undefined) {
                throw Error("Data inconsistency!");
                // this means that someone has reviewed your work for an assignment that you are not part of
                // this error shouldn't really be possible
            } else if (assignment.reviews === undefined) {
                assignment.reviews = [review];
            } else {
                assignment.reviews.push(review);
            }

        });

        const currentTime = new Date().getTime();

        this.userData.reviews.forEach((review) => {
            if (review.submissionTime === null) {
                const submissionClose = new Date(review.work.assignment.submissionClose);
                review.badge = {
                    text: "Not Submitted",
                    modifier: "danger",
                    tooltip: `Review will auto submit at: ${submissionClose.toLocaleString()}`
                };
            } else {
                const submissionTime = new Date(review.submissionTime);
                review.badge = {
                    text: "Submitted",
                    modifier: "success"
                };

                if (review.submissionTime !== review.work.assignment.submissionClose) {
                    review.badge.tooltip = `Review was submitted at: ${submissionTime.toLocaleString()}`;
                } else {
                    review.badge.tooltip = `Review was auto-submitted at: ${submissionTime.toLocaleString()}`;
                }
            }

            review.isMore = review.work.assignment.critiquesClose < currentTime;
        });

        this.userData.critiques.forEach((critique) => {
            critique.isMore = critique.work.assignment.critiquesClose < currentTime;
        });

        return {
            assignment: this.userData.assignments,
            reviews: this.userData.reviews,
            critiques: this.userData.critiques,
            moreReviews: this.userData.reviews.filter((review) => review.isMore).length,
            moreCritiques: this.userData.critiques.filter((review) => review.isMore).length,
        };

    }

    onCreate() {
    }

    onDestroy() {
    }

    async onPause() {
        this.page.find("#newReview").off("click");
    }

    async onResume() {
        const pageID = await this.templateAndPushPage();
        this.page = $(`#page${pageID}`);

        const assignmentsList = $("#assignmentsList");
        const assignmentsCollapseIcon = $("#collapseAssignmentsIcon");
        this.page.find("#collapseAssignments").click(() => {
            assignmentsList.collapse("toggle");
        });
        assignmentsList.on("show.bs.collapse", function () {
            assignmentsCollapseIcon.html("expand_less");
        }).on("hide.bs.collapse", function () {
            assignmentsCollapseIcon.html("expand_more");
        });

        const reviewsList = $("#reviewsList");
        const reviewsCollapseIcon = $("#collapseReviewsIcon");
        this.page.find("#collapseReviews").click(() => {
            reviewsList.collapse("toggle");
        });
        reviewsList.on("show.bs.collapse", function () {
            reviewsCollapseIcon.html("expand_less");
        }).on("hide.bs.collapse", function () {
            reviewsCollapseIcon.html("expand_more");
        });

        const critiquesList = $("#critiquesList");
        const critiquesCollapseIcon = $("#collapseCritiquesIcon");
        this.page.find("#collapseCritiques").click(() => {
            critiquesList.collapse("toggle");
        });
        critiquesList.on("show.bs.collapse", function () {
            critiquesCollapseIcon.html("expand_less");
        }).on("hide.bs.collapse", function () {
            critiquesCollapseIcon.html("expand_more");
        });

        const homeView = this;
        this.page.find(".assignment").each(function () {
            $(this).click(function () {
                viewManager.pushView(new AssignmentView(homeView.userData, $(this).attr('id')));
            });
        });

        this.page.find(".review").each(function () {
            $(this).click(function () {
                viewManager.pushView(new ReviewView(homeView.userData, $(this).attr('id')));
            });
        });

        this.page.find(".critique").each(function () {
            $(this).click(function () {
                viewManager.pushView(new ReviewView(homeView.userData, $(this).attr('id')));
            });
        });

        this.page.find('[data-toggle="tooltip"]').tooltip();

    }

    onSignIn() {
    }

    onSignOut() {
    }

    static getAssignmentBadges(assignment, soon = 1000 * 60 * 60 * 24) {
        // The badges are thoughtfully designed to provide the most relevant information to the user at any
        // given point. I worked out what the best labels would be by considering all possible timelines.
        //
        // Timelines had to exist within these constraints:
        //
        // SubmissionStart < ReviewStart < CritiqueStart
        // SubmissionEnd < ReviewEnd < CritiqueEnd
        //
        // SubmissionStart < SubmissionEnd, ReviewStart < ReviewEnd, CritiqueStart < CritiqueEnd
        // CritiqueEnd < ResultsPublish

        // The following table shows the 'truth table' of all combinations.
        // s, r, c, d represent submissions, reviews, critiques and weather work is submitted, respectively
        // < means not started, = means happening, > means ended
        // s   r   c   d |  Submission              Review              Critique            Results
        // <   <   <   F |  Submission open soon
        // =   <   <   F |  Submission open
        // >   ?   ?   F |  Submission Missed
        // >   <   <   T |  Submitted               Reviews open soon
        // =   <   <   T |  Submitted               Reviews open soon
        // =   =   <   F |  Submission open         Reviewing
        // =   =   <   T |  Submitted               Reviewing
        // =   =   =   F |  Submission open         Reviewing           Critiquing
        // =   =   =   T |                          Reviewing           Critiquing
        // >   =   =   T |                          Reviewing           Critiquing
        // >   =   <   T |                          Reviewing           Critiquing soon
        // >   >   =   T |                          Reviewed            Critiquing
        // >   >   <   T |                          Reviewed            Critiquing soon
        // >   >   <   T |                          Reviewed            Critiquing soon
        // >   >   >   T |                                                                  Results

        // Submission is a function of (s, d)
        // Review is a function of (r)
        // Critique is a function of (c)
        // Results are a function of (the publish time)

        // so we can now abstract away the labels themselves and consider the new table.

        // s   r   c   d |  S   R   C   Re
        // <   <   <   F |  T   F   F
        // =   <   <   F |  T   F   F
        // >   ?   ?   F |  T   F   F
        // >   <   <   T |  T   T   F
        // =   <   <   T |  T   T   F
        // =   =   <   F |  T   T   F
        // =   =   <   T |  T   T   F
        // =   =   =   F |  T   T   F
        // =   =   =   T |  F   T   T
        // >   =   =   T |  F   T   T
        // >   =   <   T |  F   T   T
        // >   >   =   T |  F   T   T
        // >   >   <   T |  F   T   T
        // >   >   <   T |  F   T   T
        // >   >   >   T |  F   F   F   T

        // from here I used intuition to build the nested if statements

        const currentTime = new Date().getTime();

        const submissionTime = new Date(assignment.work.submissionTime);
        const submissionOpen = new Date(assignment.submissionOpen);
        const submissionClose = new Date(assignment.submissionClose);
        const submissionBadge = (assignment.work.submissionTime !== null) ? {
            text: "Submitted",
            modifier: "success",
            tooltip: `You submitted your work at: ${submissionTime.toLocaleString()}`
        } : (currentTime + soon < assignment.submissionOpen) ? {
            text: "Submission Not Open",
            modifier: "info",
            tooltip: `Submissions opens at: ${submissionOpen.toLocaleString()}`
        } : (currentTime < assignment.submissionOpen) ? {
            text: "Submission Open Soon",
            modifier: "info",
            tooltip: `Submissions opens at: ${submissionOpen.toLocaleString()}`
        } : (currentTime < assignment.submissionClose) ? {
            text: "Submission Open",
            modifier: "warning",
            tooltip: `Submissions closes at: ${submissionClose.toLocaleString()}`
        } : {
            text: "Submission Missed",
            modifier: "danger",
            tooltip: `Submissions closed at: ${submissionClose.toLocaleString()}`
        };
        submissionBadge.isVisible = false;

        const reviewsOpen = new Date(assignment.reviewsOpen);
        const reviewsClose = new Date(assignment.reviewsClose);
        const reviewBadge = (currentTime + soon < assignment.reviewsOpen) ? {
            text: "Reviews Not Open",
            modifier: "info",
            tooltip: `Reviews opens at: ${reviewsOpen.toLocaleString()}`
        } : (currentTime < assignment.reviewsOpen) ? {
            text: "Reviews Open Soon",
            modifier: "info",
            tooltip: `Reviews opens at: ${reviewsOpen.toLocaleString()}`
        } : (currentTime < assignment.reviewsClose) ? {
            text: "Reviews Open",
            modifier: "warning",
            tooltip: `Reviews close at: ${reviewsClose.toLocaleString()}`
        } : {
            text: "Reviews Closed",
            modifier: "success",
            tooltip: `Reviews closed at: ${reviewsClose.toLocaleString()}`
        };
        reviewBadge.isVisible = false;

        const critiquesOpen = new Date(assignment.critiquesOpen);
        const critiquesClose = new Date(assignment.critiquesClose);
        const critiqueBadge = (currentTime + soon < assignment.critiquesOpen) ? {
            text: "Critiques Not Open",
            modifier: "info",
            tooltip: `Critiques opens at: ${critiquesOpen.toLocaleString()}`
        } : (currentTime < assignment.critiquesOpen) ? {
            text: "Critiques Open Soon",
            modifier: "info",
            tooltip: `Critiques opens at: ${critiquesOpen.toLocaleString()}`
        } : (currentTime < assignment.critiquesClose) ? {
            text: "Critiques Open",
            modifier: "warning",
            tooltip: `Critiques close at: ${critiquesClose.toLocaleString()}`
        } : {
            text: "Critiques Closed",
            modifier: "success",
            tooltip: `Critiques closed at: ${critiquesClose.toLocaleString()}`
        };
        critiqueBadge.isVisible = false;

        const publishTime = new Date(assignment.resultsPublish);
        const resultsBadge = (currentTime < assignment.critiquesClose) ? {
            text: "Results Not Finished",
            modifier: "info",
            tooltip: `Results publish at: ${publishTime.toLocaleString()}`
        } : (currentTime + soon < assignment.resultsPublish) ? {
            text: "Results Not Published",
            modifier: "info",
            tooltip: `Results publish at: ${publishTime.toLocaleString()}`
        } : (currentTime < assignment.resultsPublish) ? {
            text: "Results Publish Soon",
            modifier: "info",
            tooltip: `Results publish at: ${publishTime.toLocaleString()}`
        } : {
            text: "Results Published",
            modifier: "success",
            tooltip: `Results published at: ${publishTime.toLocaleString()}`
        };
        resultsBadge.isVisible = false;

        if (assignment.work.submissionTime === null && submissionClose < currentTime) {// missed submission
            submissionBadge.isVisible = true;

        } else if (critiquesClose < currentTime) { // peer review is over
            resultsBadge.isVisible = true;

        } else {
            submissionBadge.isVisible = assignment.work.submissionTime === null || currentTime < reviewsOpen;
            reviewBadge.isVisible = assignment.work.submissionTime !== null || currentTime > reviewsOpen;
            critiqueBadge.isVisible = assignment.work.submissionTime !== null && currentTime > reviewsOpen;
        }

        return {
            submission: submissionBadge,
            review: reviewBadge,
            critique: critiqueBadge,
            results: resultsBadge
        };
    }
}

class AssignmentView extends View {
    constructor(userData, assignmentID) {
        super("/templates/assignment.mustache");
        this.userData = userData;
        this.assignment = userData.assignments.find((assignment) => assignment.assignmentID === assignmentID);
    }

    getTemplateContext() {

        const totalCatWeight = this.assignment.markingCategories.map((cat) => cat.weight)
            .reduce((a, b) => a + b, 0); // this reduce takes the sum
        for (let cat of this.assignment.markingCategories) {
            cat.weightString = (100 * cat.weight / totalCatWeight).toPrecision(3);
        }

        this.assignment.markingCategories.forEach((cat) => {
            const totalCritWeight = cat.markingCriteria.map((crit) => crit.weight)
                .reduce((a, b) => a + b, 0);
            for (let crit of cat.markingCriteria) {
                crit.weightString = (100 * crit.weight / totalCritWeight).toPrecision(3);
            }
        });

        this.assignment.submissionOpenString = new Date(this.assignment.submissionOpen).toLocaleString();
        this.assignment.submissionCloseString = new Date(this.assignment.submissionClose).toLocaleString();

        this.assignment.reviewsOpenString = new Date(this.assignment.reviewsOpen).toLocaleString();
        this.assignment.reviewsCloseString = new Date(this.assignment.reviewsClose).toLocaleString();

        this.assignment.critiqueOpenString = new Date(this.assignment.critiquesOpen).toLocaleString();
        this.assignment.critiqueCloseString = new Date(this.assignment.critiquesClose).toLocaleString();

        this.assignment.resultsPublishString = new Date(this.assignment.resultsPublish).toLocaleString();

        const currentTime = new Date().getTime();
        this.assignment.isSubmitted = this.assignment.work.submissionTime !== null;
        this.assignment.submissionTimeString = new Date(this.assignment.work.submissionTime).toLocaleString();

        this.assignment.submissionOpen = this.assignment.submissionOpen < currentTime &&
            currentTime < this.assignment.submissionClose;
        this.assignment.reviewsOpen = this.assignment.reviewsOpen < currentTime &&
            currentTime < this.assignment.reviewsClose;
        this.assignment.critiquesOpen = this.assignment.critiquesOpen < currentTime &&
            currentTime < this.assignment.critiquesClose;

        return this.assignment;
    }

    onCreate() {
    }

    onDestroy() {
    }

    onPause() {
    }

    async onResume() {
        const pageID = await this.templateAndPushPage();
        this.page = $(`#page${pageID}`);

        this.page.find(".category").each(function () {
            const criteriaList = $(this).find("#criteriaList");
            const collapseIcon = $(this).find("#collapseCriteriaIcon");
            $(this).click(function () {
                criteriaList.collapse("toggle");
            });
            criteriaList.on("show.bs.collapse", function () {
                collapseIcon.html("expand_less");
            }).on("hide.bs.collapse", function () {
                collapseIcon.html("expand_more");
            });
        });

        const marking = this.page.find("#marking");
        const markingIcon = this.page.find("#collapseMarkingIcon");
        this.page.find("#collapseMarking").click(() => {
            marking.collapse("toggle");
        });
        marking.on("show.bs.collapse", function () {
            markingIcon.html("expand_less");
        }).on("hide.bs.collapse", function () {
            markingIcon.html("expand_more");
        });

        const timeline = this.page.find("#timeline");
        const timelineIcon = this.page.find("#collapseTimelineIcon");
        this.page.find("#collapseTimeline").click(() => {
            timeline.collapse("toggle");
        });
        timeline.on("show.bs.collapse", function () {
            timelineIcon.html("expand_less");
        }).on("hide.bs.collapse", function () {
            timelineIcon.html("expand_more");
        });

        const submission = this.page.find("#submission");
        const submissionIcon = this.page.find("#collapseSubmissionIcon");
        this.page.find("#collapseSubmission").click(() => {
            submission.collapse("toggle");
        });
        submission.on("show.bs.collapse", function () {
            submissionIcon.html("expand_less");
        }).on("hide.bs.collapse", function () {
            submissionIcon.html("expand_more");
        });

        this.page.find("#addToCalendar").click(() => {
            gapi.auth2.getAuthInstance().currentUser.get().grant(new gapi.auth2.SigninOptionsBuilder({
                scope: 'email https://www.googleapis.com/auth/calendar.events',
            })).then(async (success) => {

                const events = [{
                    start: this.assignment.submissionOpen,
                    end: this.assignment.submissionClose,
                    description: "The submission period of the assignment",
                    title: "Submissions"
                }, {
                    start: this.assignment.reviewsOpen,
                    end: this.assignment.reviewsClose,
                    description: "The review period of the assignment",
                    title: "Reviews"
                }, {
                    start: this.assignment.critiquesOpen,
                    end: this.assignment.critiquesClose,
                    description: "The critique period of the assignment",
                    title: "Critiques"
                }, {
                    start: this.assignment.resultsPublish,
                    end: this.assignment.resultsPublish,
                    description: "The results publish at this time",
                    title: "Results"
                }];

                const batchInsert = gapi.client.newBatch();
                for (let event of events) {
                    batchInsert.add(gapi.client.calendar.events.insert({
                        "calendarId": "primary",
                        "resource": {
                            "start": {"dateTime": new Date(event.start).toISOString()},
                            "end": {"dateTime": new Date(event.end).toISOString()},
                            "description": event.description,
                            "summary": `${this.assignment.title} - ${event.title}`,
                        }
                    }));
                }

                batchInsert.then((result) => {
                    console.log(result);
                    // TODO deal with errors
                });
            }, (fail) => {
                // TODO work on the unified error system thing, couldn't get scope
            });

        });

        let isUpload = false;
        const submitButton = this.page.find("#submitButton");
        const fileDiv = this.page.find("#fileDiv");
        const fileLabel = this.page.find("label[for=fileToUpload]");
        const fileInput = this.page.find("#fileToUpload");

        const originalLabel = submitButton.text();
        const originalFileLabel = fileLabel.text();

        submitButton.click(async () => {
            // this button changes label, isUpload stores the state!

            if (isUpload) {

                const formData = new FormData();
                formData.append('file', fileInput.get(0).files[0]);
                formData.append("workerID", this.userData.userID);
                formData.append("assignmentID", this.assignment.assignmentID);

                const response = await fetch('/submission', {
                    method: 'POST',
                    body: formData,
                    headers: {token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token}
                });
                fileDiv.collapse("hide");
                fileInput.removeClass("is-invalid");
                fileInput.removeClass("is-valid");

                if (response.status === 200) {
                    this.assignment.work = await response.json();

                    this.page.find("#downloadButton").show();
                    this.page.find("#submittedText").show();

                    const timeString = new Date(this.assignment.work.submissionTime).toLocaleString();
                    this.page.find("#submissionTimeString").text(timeString);
                    this.page.find("#noSubmissionMessage").hide();

                } else {

                }
            } else {
                submitButton.attr("disabled", true);
                fileDiv.collapse("show");
                fileLabel.text(originalFileLabel);
                document.querySelector("#fileToUpload").value = "";
            }
            isUpload = !isUpload;
            submitButton.text(isUpload ? "Upload" : originalLabel);

        });

        this.page.find("#fileToUpload").change(() => {
            fileLabel.text(fileInput.get(0).files[0].name);
            if (fileInput.get(0).files[0].type !== "application/x-zip-compressed") {
                fileInput.value = "";

                fileInput.removeClass("is-valid");
                fileInput.addClass("is-invalid");
                submitButton.attr("disabled", true);
            } else {
                fileInput.removeClass("is-invalid");
                fileInput.addClass("is-valid");
                submitButton.attr("disabled", false);
            }
        });

        this.page.find("#downloadButton").click(async () => {

            const name = `${this.assignment.assignmentID}-${
                this.assignment.work.workerID}.zip`;

            const request = await fetch(`/work/${this.assignment.assignmentID}/${this.userData.userID}`, {
                headers: {token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token}
            });


            const blob = await request.blob();
            download(blob, this.assignment.assignmentID + "-" + this.assignment.workerID, "application/zip");

        });

        this.page.find("#backButton").click(() => {
            viewManager.popView();
        });

        this.page.find('[data-toggle="tooltip"]').tooltip();
    }

    onSignIn() {
    }

    onSignOut() {
    }
}


let viewManager = undefined;
document.addEventListener("DOMContentLoaded", function () {
    viewManager = new ViewManager();
});