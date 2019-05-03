/**
 * This is the home page view
 */
class HomeView extends View {
  constructor(userData) {
    super("/templates/home.mustache");

    this.userData = userData;
  }

  /**
     * @inheritDoc
     */
  async getTemplateContext() {

    return {
      assignment: this.userData.assignments,
      reviews: this.userData.reviews,
      critiques: this.userData.critiques,
      moreReviews: this.userData.reviews.filter((review) => review.isMore).length,
      moreCritiques: this.userData.critiques.filter((review) => review.isMore).length,
    };


  }

  /**
     * @inheritDoc
     */
  async onCreate() {

    const currentTime = new Date().getTime();

    const assignmentDataPromise = fetch(`/assignments?workerID=${encodeURI(this.userData.userID)}`, {
      headers: {token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token},
    }).then((response) => response.json());

    const reviewDataPromise = fetch(`/reviews?ownerID=${encodeURI(this.userData.userID)}`, {
      headers: {token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token},
    }).then((response) => response.json());


    try {
      const [assignmentData, reviewsData] = await View.promiseTimeout(
        Promise.all([assignmentDataPromise, reviewDataPromise]),
      );

      const assignmentsMap = {};
      this.userData.assignments = assignmentData.map((assignment) => {
        assignment.badges = HomeView.getAssignmentBadges(assignment);
        assignmentsMap[assignment.assignmentID] = assignment;
        assignment.resultsPublished = currentTime > assignment.resultsPublish;

        assignment.ownReviews = [];
        assignment.ownCritiques = [];

        assignment.reviews = [];

        return assignment;
      });

      this.userData.reviews = reviewsData.reviewer;
      this.userData.critiques = reviewsData.critic;
      reviewsData.worker.forEach((review) => {
        // these are the reviews of your work
        // they are stored with the assignments

        const assignment = assignmentsMap[review.assignmentID];
        assignment.reviews.push(review);
      });

      this.userData.reviews.forEach(review => {
        HomeView.processReview(review, currentTime, assignmentsMap);
      });

      this.userData.critiques.forEach(critique => {
        HomeView.processCritique(critique, currentTime, assignmentsMap);
      });

      this.userData.assignments.forEach(assignment => {
        assignment.hasResults = assignment.reviews.length !== 0;

        assignment.validReviews = assignment.ownReviews.filter((review) => review.isComplete
                    && review.assignmentID === assignment.assignmentID).length;
        assignment.validCritiques = assignment.ownCritiques.filter(critique => critique.isComplete
                    && critique.assignmentID === assignment.assignmentID).length;

        if (assignment.hasResults) {

          const criteriaMap = {};

          assignment.markingCategories.flatMap(category => category.markingCriteria)
            .flatMap(criteria => {
              criteriaMap[criteria.categoryID + criteria.criteriaID] = criteria;
              criteria.grades = [];
            });

          assignment.reviews.forEach(review => {
            const gradeMap = {};
            review.grades.forEach(grade => {
              grade.markString = (100 * grade.mark).toFixed(0);

              grade.reviewer = review.reviewer;

              grade.cGrades = [];
              gradeMap[grade.categoryID + grade.criteriaID] = grade;
              criteriaMap[grade.categoryID + grade.criteriaID].grades.push(grade);
            });
            review.critiques.forEach(critique => {
              critique.critiquedGrades.forEach(cGrade => {
                cGrade.markString = (100 * cGrade.proposedMark).toFixed(0);
                cGrade.isAgreeing = cGrade.state === 0;
                cGrade.isAccepted = cGrade.state === 2;
                cGrade.isRejected = cGrade.state === 3;
                cGrade.isAutoRejected = cGrade.state === 4;

                cGrade.critic = critique.critic;

                gradeMap[cGrade.categoryID + cGrade.criteriaID].cGrades.push(cGrade);
              });
            });
          });


          assignment.markingCategories.forEach(category => {
            category.markingCriteria.forEach(criteria => {

              const marks = criteria.grades.map((grade) => {
                const totalMark = grade.cGrades.map((cGrade) => {
                  if (cGrade.state === 2) {
                    return cGrade.proposedMark;
                  } else {
                    return grade.mark;
                  }
                }).reduce((a, b) => a + b, 0) + grade.mark;

                // grade.mark = ;
                // grade.markString = (100 * grade.mark).toFixed(0);

                // return grade.mark;
                return totalMark / (grade.cGrades.length + 1);
              });
              criteria.mark = marks.length === 0 ? 0 : marks.reduce((a, b) => a + b, 0) / marks.length;
              criteria.markString = (criteria.mark * 100).toFixed(0);

            });

            const totalMark = category.markingCriteria
              .map(criteria => criteria.weight * criteria.mark)
              .reduce((a, b) => a + b);
            const totalWeight = category.markingCriteria
              .map(criteria => criteria.weight)
              .reduce((a, b) => a + b);

            category.mark = totalMark / totalWeight;
            category.markString = (category.mark * 100).toFixed(0);

          });

          const totalMark = assignment.markingCategories
            .map(criteria => criteria.weight * criteria.mark)
            .reduce((a, b) => a + b, 0);
          const totalWeight = assignment.markingCategories
            .map(criteria => criteria.weight)
            .reduce((a, b) => a + b, 0);

          assignment.mainMark = totalMark / totalWeight;
          assignment.mainMarkString = (assignment.mainMark * 100).toFixed(0);

          assignment.reviewMark = Math.min(
            assignment.validReviews,
            assignment.minReviews,
          ) / assignment.minReviews;
          assignment.reviewMarkString = (assignment.reviewMark * 100).toFixed(0);

          assignment.critiqueMark = Math.min(
            assignment.validCritiques,
            assignment.minCritiques,
          ) / assignment.minCritiques;
          assignment.critiqueMarkString = (assignment.critiqueMark * 100).toFixed(0);

        }

      });


      /**
             * This compare function first sorts by isMore, and then by whether
             * the can be edited and then if they have critiques that need action
             * @param a The first review object
             * @param b The second review object
             * @return {number} Compare result, 0 means same, -1 means a < b, 1 means a > b
             */
      const compareFunction = (a, b) => {
        if (a.isMore === b.isMore) {
          if (a.hasPendingCritiques === b.hasPendingCritiques) {
            if (a.isSubmitted === b.isSubmitted) {

              return a.assignment.title < b.assignment.title ? -1 : 1;
            } else if (b.isSubmitted) {
              return -1;
            } else {
              return 1;
            }
          } else if (a.hasPendingCritiques) {
            return -1;
          } else {
            return 1;
          }
        } else if (b.isMore) {
          return -1;
        } else {
          return 1;
        }
      };
      this.userData.reviews.sort(compareFunction);
      this.userData.critiques.sort(compareFunction);
    } catch (e) {
      viewManager.showErrorModal();
    }

    this.state = {
      home: {},
    };

    history.replaceState(this.state, "DurPeer Home", "/");

  }

  /**
     * @inheritDoc
     */
  async onDestroy() {
  }

  /**
     * @inheritDoc
     */
  async onPause() {
    this.page.find("#newReview").off("click");
  }

  /**
     * @inheritDoc
     */
  async onResume() {

    this.page = await this.templateAndPushPage();

    const assignmentsList = $("#assignmentsList");
    const assignmentsCollapseIcon = $("#collapseAssignmentsIcon");
    this.page.find("#collapseAssignments").click(() => {
      assignmentsList.collapse("toggle");
    });
    assignmentsList.on("show.bs.collapse", function (event) {
      assignmentsCollapseIcon.html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      assignmentsCollapseIcon.html("expand_more");
      event.stopPropagation();
    });

    const reviewsList = $("#reviewsList");
    const reviewsCollapseIcon = $("#collapseReviewsIcon");
    this.page.find("#collapseReviews").click(() => {
      reviewsList.collapse("toggle");
    });
    reviewsList.on("show.bs.collapse", function (event) {
      reviewsCollapseIcon.html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      reviewsCollapseIcon.html("expand_more");
      event.stopPropagation();
    });

    const critiquesList = $("#critiquesList");
    const critiquesCollapseIcon = $("#collapseCritiquesIcon");
    this.page.find("#collapseCritiques").click(() => {
      critiquesList.collapse("toggle");
    });
    critiquesList.on("show.bs.collapse", function (event) {
      critiquesCollapseIcon.html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      critiquesCollapseIcon.html("expand_more");
      event.stopPropagation();
    });

    const homeView = this;
    this.page.find(".assignment").each(function () {
      $(this).click(function () {
        viewManager.pushView(new AssignmentView(homeView.userData, $(this).attr("id")));
      });
    });

    this.page.find(".review").each(function () {
      $(this).click(function () {
        viewManager.pushView(new ReviewView(homeView.userData, $(this).attr("id")));
      });
    });

    this.page.find(".critique").each(function () {
      $(this).click(function () {
        viewManager.pushView(new CritiqueView(homeView.userData, $(this).attr("id")));
      });
    });

    const moreReviews = this.page.find("#moreReviews");
    moreReviews.click(() => {
      this.page.find(".moreReview").show();
      moreReviews.hide();
    });
    const moreCritiques = this.page.find("#moreCritiques");
    moreCritiques.click(() => {
      this.page.find(".moreCritique").show();
      moreCritiques.hide();
    });

    this.page.find("[data-toggle=\"tooltip\"]").tooltip();
  }

  /**
     * @inheritDoc
     */
  async onSignIn() {
    // This should never happen, should always be signed in
  }

  /**
     * @inheritDoc
     */
  async onSignOut() {
    await viewManager.popAllPush(new AboutView());
  }

  /**
     * This function deep clones objects
     * @param object {*} The object to be cloned
     * @return {*} The result of the clone
     */
  static deepClone(object) {
    if (object === null) {
      return null;
    } else if (Array.isArray(object)) {
      return object.map((item) => HomeView.deepClone(item));
    } else if (typeof object !== "object") {
      return object;
    } else {
      const result = {};
      for (let key of Object.getOwnPropertyNames(object)) {
        result[key] = HomeView.deepClone(object[key]);
      }
      return result;
    }
  }

  /**
     * @typedef {Object} AssignmentBadge
     * @property {string} text - The text displayed in the centre of the badge
     * @property {string} modifier - The bootstrap modifier of the badge e.g. 'badge-' + modifier
     * @property {string} tooltip - The tooltip that shows for this badge
     *
     */

  /**
     * TODO improve the abstraction by making an Assignment class
     *
     * This function computes the badges for an assignment.  Some badges refer to relative time and label an event as
     * happening 'soon'.
     *
     * @param assignment {Assignment} The assignment for which badges are created
     * @param soon {Number} The soon time interval in milliseconds
     * @return {{
     *      review: AssignmentBadge,
     *      critique: AssignmentBadge,
     *      submission: AssignmentBadge,
     *      results: AssignmentBadge
     *      }} The map of badges
     */
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
      tooltip: `You submitted your work at: ${submissionTime.toLocaleString()}`,
    } : (currentTime + soon < assignment.submissionOpen) ? {
      text: "Submission Not Open",
      modifier: "info",
      tooltip: `Submissions opens at: ${submissionOpen.toLocaleString()}`,
    } : (currentTime < assignment.submissionOpen) ? {
      text: "Submission Open Soon",
      modifier: "info",
      tooltip: `Submissions opens at: ${submissionOpen.toLocaleString()}`,
    } : (currentTime < assignment.submissionClose) ? {
      text: "Submission Open",
      modifier: "warning",
      tooltip: `Submissions closes at: ${submissionClose.toLocaleString()}`,
    } : {
      text: "Submission Missed",
      modifier: "danger",
      tooltip: `Submissions closed at: ${submissionClose.toLocaleString()}`,
    };
    submissionBadge.isVisible = false;

    const reviewsOpen = new Date(assignment.reviewsOpen);
    const reviewsClose = new Date(assignment.reviewsClose);
    const reviewBadge = (currentTime + soon < assignment.reviewsOpen) ? {
      text: "Reviews Not Open",
      modifier: "info",
      tooltip: `Reviews opens at: ${reviewsOpen.toLocaleString()}`,
    } : (currentTime < assignment.reviewsOpen) ? {
      text: "Reviews Open Soon",
      modifier: "info",
      tooltip: `Reviews opens at: ${reviewsOpen.toLocaleString()}`,
    } : (currentTime < assignment.reviewsClose) ? {
      text: "Reviews Open",
      modifier: "warning",
      tooltip: `Reviews close at: ${reviewsClose.toLocaleString()}`,
    } : {
      text: "Reviews Closed",
      modifier: "success",
      tooltip: `Reviews closed at: ${reviewsClose.toLocaleString()}`,
    };
    reviewBadge.isVisible = false;

    const critiquesOpen = new Date(assignment.critiquesOpen);
    const critiquesClose = new Date(assignment.critiquesClose);
    const critiqueBadge = (currentTime + soon < assignment.critiquesOpen) ? {
      text: "Critiques Not Open",
      modifier: "info",
      tooltip: `Critiques opens at: ${critiquesOpen.toLocaleString()}`,
    } : (currentTime < assignment.critiquesOpen) ? {
      text: "Critiques Open Soon",
      modifier: "info",
      tooltip: `Critiques opens at: ${critiquesOpen.toLocaleString()}`,
    } : (currentTime < assignment.critiquesClose) ? {
      text: "Critiques Open",
      modifier: "warning",
      tooltip: `Critiques close at: ${critiquesClose.toLocaleString()}`,
    } : {
      text: "Critiques Closed",
      modifier: "success",
      tooltip: `Critiques closed at: ${critiquesClose.toLocaleString()}`,
    };
    critiqueBadge.isVisible = false;

    const publishTime = new Date(assignment.resultsPublish);
    const resultsBadge = (currentTime < assignment.critiquesClose) ? {
      text: "Results Not Finished",
      modifier: "info",
      tooltip: `Results publish at: ${publishTime.toLocaleString()}`,
    } : (currentTime + soon < assignment.resultsPublish) ? {
      text: "Results Not Published",
      modifier: "info",
      tooltip: `Results publish at: ${publishTime.toLocaleString()}`,
    } : (currentTime < assignment.resultsPublish) ? {
      text: "Results Publish Soon",
      modifier: "info",
      tooltip: `Results publish at: ${publishTime.toLocaleString()}`,
    } : {
      text: "Results Published",
      modifier: "success",
      tooltip: `Results published at: ${publishTime.toLocaleString()}`,
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
      results: resultsBadge,
    };
  }

  /**
     * This function processes a review, reorganising information and calculating values that are needed to template
     * the website
     * @param review {Object} The review that is to be processed
     * @param currentTime {Number} The unix timestamp
     * @param assignmentsMap
     */
  static processReview(review, currentTime, assignmentsMap) {

    const assignment = assignmentsMap[review.assignmentID];

    assignment.ownReviews.push(review);

    review.assignment = HomeView.deepClone(assignment);
    delete review.assignment.work; // remove the cyclic reference ,mostly for debug

    const criteriaKeyMap = {};
    review.assignment.markingCategories
      .flatMap((category) => category.markingCriteria)
      .forEach((criteria) => {
        criteriaKeyMap[criteria.categoryID + criteria.criteriaID] = criteria;
      });
    review.grades.forEach((grade) => {
      criteriaKeyMap[grade.categoryID + grade.criteriaID].grade = grade;
      grade.markString = grade.mark === null ? "" : (grade.mark * 100).toFixed(0);
    });

    const critiqueKeyMap = {};
    const pendingBadge = {
      text: "Pending",
      modifier: "warning",
      tooltip: `Results publish at: ${new Date(review.assignment.resultsPublish).toLocaleString()}`,
      class: "pendingBadge",
      isVisible: true,
    };
    const acceptedBadge = {
      text: "Accepted",
      modifier: "success",
      tooltip: "You accepted this critique",
      class: "acceptBadge",
      isVisible: true,
    };
    const rejectedBadge = {
      text: "Rejected",
      modifier: "success",
      tooltip: "You rejected this critique",
      class: "rejectBadge",
      isVisible: true,
    };
    const autoRejectedBadge = {
      text: "Auto-Rejected",
      modifier: "danger",
      tooltip: "You failed to accept or reject this critique, so it was auto rejected",
      isVisible: true,
    };
    const agreeingBadge = {
      text: "Agreeing",
      modifier: "",
      tooltip: "The critic agrees with this grade",
      isVisible: true,
    };

    review.critiques
      .flatMap((critique) => {
        critiqueKeyMap[critique.criticID] = critique; // at this stage, only one critique per criticID
        return critique.critiquedGrades;
      })
      .forEach((cGrade) => {
        if (criteriaKeyMap[cGrade.categoryID + cGrade.criteriaID].cGrades === undefined) {
          criteriaKeyMap[cGrade.categoryID + cGrade.criteriaID].cGrades = [cGrade];
        } else {
          criteriaKeyMap[cGrade.categoryID + cGrade.criteriaID].cGrades.push(cGrade);
        }
        cGrade.isAgreeing = cGrade.state === 0;
        cGrade.isPending = cGrade.state === 1;
        cGrade.isAccepted = cGrade.state === 2;
        cGrade.isRejected = cGrade.state === 3;
        cGrade.isAutoRejected = cGrade.state === 4;
        cGrade.critic = critiqueKeyMap[cGrade.criticID].critic;
        cGrade.markString = (100 * cGrade.proposedMark).toFixed(0);

        if (cGrade.isPending) {
          cGrade.badges = [
            pendingBadge,
            Object.assign({}, acceptedBadge, {isVisible: false}),
            Object.assign({}, rejectedBadge, {isVisible: false}),
          ];
        } else if (cGrade.isAccepted) {
          cGrade.badges = [acceptedBadge];
        } else if (cGrade.isRejected) {
          cGrade.badges = [rejectedBadge];
        } else if (cGrade.isAutoRejected) {
          cGrade.badges = [autoRejectedBadge];
        } else {
          cGrade.badges = [agreeingBadge];
        }

      });


    review.assignment.markingCategories
      .flatMap((category) => category.markingCriteria)
      .forEach((criteria) => {
        criteria.isComplete = criteria.grade !== undefined &&
                    criteria.grade.mark !== undefined && criteria.grade.mark !== null &&
                    criteria.grade.comment !== undefined && criteria.grade.comment !== null;
        criteria.hasPending = criteria.cGrades !== undefined
                    && criteria.cGrades.some((cGrade) => cGrade.state === 1);

        if (criteria.cGrades !== undefined) {
          criteria.cGrades.sort((a, b) => a.isPending === b.isPending ? 0 : a.isPending ? -1 : 1);
        }
        criteria.moreGrades = criteria.cGrades === undefined
          ? 0
          : criteria.cGrades.filter((cGrade) => !cGrade.isPending).length;
      });
    review.assignment.markingCategories.forEach((category) => {
      category.isComplete = category.markingCriteria.every((criteria) => criteria.isComplete);
      category.hasPending = category.markingCriteria.some((criteria) => criteria.hasPending);
    });
    review.isComplete = review.comment !== null
            && review.comment.length !== 0
            && review.assignment.markingCategories.every((category) => category.isComplete);

    review.isEmpty = review.assignment.markingCategories
      .flatMap((category) => category.markingCriteria)
      .every((criteria) => !criteria.isComplete)
            && (review.comment === null || review.comment.length === 0);

    review.isSubmitted = review.submissionTime !== null || review.assignment.reviewsClose < currentTime;

    review.hasPendingCritiques = review.assignment.markingCategories.some((category) => category.hasPending);

    review.badges = HomeView.getReviewBadges(review, currentTime);
    review.isMore = review.assignment.critiquesClose < currentTime || review.isEmpty && review.isSubmitted;

  }

  /**
     * @typedef {Object} ReviewBadge
     * @property {string} text - The text displayed in the centre of the badge
     * @property {string} modifier - The bootstrap modifier of the badge e.g. 'badge-' + modifier
     * @property {string} tooltip - The tooltip that shows for this badge
     * @property {boolean} isVisible - if the tooltip will be displayed
     *
     */

  /**
     * TODO improve the abstraction by making an Review class
     *
     * This function computes the badges for a review
     *
     * @param review {Object} The review for which badges are created
     * @param currentTime {Number} The soon time interval in milliseconds
     * @return {ReviewBadge[]} The array of badges for the review
     */
  static getReviewBadges(review, currentTime) {
    const badges = [];
    if (review.isSubmitted) {
      if (review.isEmpty) {
        badges.push({
          text: "Submission Missed",
          modifier: "danger",
          tooltip: `Reviews closed at: ${new Date(review.assignment.reviewsClose).toLocaleString()}`,
          isVisible: true,
        });
      } else if (review.isComplete) {
        badges.push({
          text: "Submitted",
          modifier: "success",
          tooltip: `Review submitted at: ${new Date(review.submissionTime).toLocaleString()}`,
          isVisible: true,
        });
      } else {
        badges.push({
          text: "Submitted Incomplete",
          modifier: "info",
          tooltip: `Review was submitted automatically at: ${
            new Date(review.submissionTime).toLocaleString()}`,
          isVisible: true,
        });
      }
      if (!review.isEmpty) {
        //currentTime < review.assignment.critiquesClose

        if (review.assignment.critiquesClose < currentTime && review.hasPendingCritiques) {
          badges.push({
            text: "Critiques Missed",
            modifier: "danger",
            tooltip: `Critiques closed at: ${new Date(review.critiquesClose).toLocaleString()}`,
            isVisible: true,
          });
        } else {
          const critiqueBadge = Object.assign({}, review.assignment.badges.critique, {
            modifier: "info",
            id: "critiqueBadge",
            isVisible: true,
          }); // clone and change the modifier to "info"

          if (currentTime < review.assignment.critiquesOpen
                        || review.assignment.critiquesClose < currentTime) {
            badges.push(critiqueBadge);
          } else if (!review.hasPendingCritiques) {
            badges.push(critiqueBadge);
          } else {
            badges.push({
              text: "Pending Critiques",
              modifier: "danger",
              tooltip: `Critiques close at: ${
                new Date(review.assignment.critiquesClose).toLocaleString()}`,
              isVisible: true,
              id: "pendingBadge",
            });
            badges.push(Object.assign(critiqueBadge, {
              isVisible: false,
            }));
          }
        }
      }
    } else {
      if (review.isComplete) {
        badges.push({
          text: "Not Submitted",
          modifier: "warning",
          tooltip: `Reviews close at: ${new Date(review.assignment.reviewsClose).toLocaleString()}`,
          id: "completeBadge",
          isVisible: true,
        });
      } else {
        badges.push({
          text: "Review Incomplete",
          modifier: "warning",
          tooltip: `Reviews close at: ${new Date(review.assignment.reviewsClose).toLocaleString()}`,
          id: "completeBadge",
          isVisible: true,
        });
      }
    }
    return badges;
  }

  /**
     * This function processes a critique, it reorganises information and calculates values that are needed to template
     * various views
     * @param review
     * @param currentTime
     * @param assignmentsMap
     */
  static processCritique(review, currentTime, assignmentsMap) {

    const assignment = assignmentsMap[review.assignmentID];

    assignment.ownCritiques.push(review);

    review.assignment = HomeView.deepClone(assignment);
    delete review.assignment.work; // remove the cyclic reference ,mostly for debug

    const criteriaKeyMap = {};
    review.assignment.markingCategories
      .flatMap((category) => category.markingCriteria)
      .forEach((criteria) => {
        criteriaKeyMap[criteria.categoryID + criteria.criteriaID] = criteria;
      });
    review.grades.forEach((grade) => {
      criteriaKeyMap[grade.categoryID + grade.criteriaID].grade = grade;
      grade.markString = grade.mark === null ? "" : (grade.mark * 100).toFixed(0);
    });
    review.critique.critiquedGrades.forEach((cGrade) => {
      criteriaKeyMap[cGrade.categoryID + cGrade.criteriaID].cGrade = cGrade;
      cGrade.markString = cGrade.proposedMark === null
        ? ""
        : (cGrade.proposedMark * 100).toFixed(0);
    });

    review.assignment.markingCategories
      .flatMap((category) => category.markingCriteria)
      .forEach((criteria) => {
        criteria.hasGrade = criteria.grade !== undefined;
        criteria.isComplete = !criteria.hasGrade ||
                    criteria.cGrade !== undefined &&
                    criteria.cGrade.comment !== null &&
                    criteria.cGrade.comment.length !== 0 &&
                    criteria.cGrade.proposedMark !== null;
      });

    review.assignment.markingCategories
      .forEach((category) => {
        category.hasGrades = category.markingCriteria.some((criteria) => criteria.hasGrade);
        category.isComplete = category.markingCriteria.every((criteria) => criteria.isComplete);
      });
    review.isComplete = review.assignment.markingCategories
      .every((category) => category.isComplete);
    review.isSubmitted = review.critique.submissionTime !== null;

    review.badges = HomeView.getCritiqueBadges(review, currentTime);
    review.isMore = review.assignment.critiquesClose < currentTime || review.isSubmitted;

  }

  /**
     * @typedef {Object} CritiqueBadge
     * @property {string} text - The text displayed in the centre of the badge
     * @property {string} modifier - The bootstrap modifier of the badge e.g. 'badge-' + modifier
     * @property {string} tooltip - The tooltip that shows for this badge
     * @property {string|undefined} id - the id that the badge <span> will be labeled with
     * @property {boolean} isVisible - if the tooltip will be displayed
     *
     */

  // TODO make a badge class to remove all this redundancy

  /**
     * This function computes the badges for a given critique
     * @param critique
     * @return {CritiqueBadge[]}
     */
  static getCritiqueBadges(critique) {
    const badges = [];
    if (critique.isSubmitted) {
      if (critique.isEmpty) {
        badges.push({
          text: "Submission Missed",
          modifier: "danger",
          tooltip: `Critiques closed at: ${new Date(critique.assignment.reviewsClose).toLocaleString()}`,
          isVisible: true,
        });
      } else if (critique.isComplete) {
        badges.push({
          text: "Submitted",
          modifier: "success",
          tooltip: `Critique submitted at: ${new Date(critique.critique.submissionTime).toLocaleString()}`,
          isVisible: true,
        });
      } else {
        badges.push({
          text: "Submitted Incomplete",
          modifier: "info",
          tooltip: `Critique was submitted automatically at: ${
            new Date(critique.submissionTime).toLocaleString()}`,
          isVisible: true,
        });
      }
    } else {
      if (critique.isComplete) {
        badges.push({
          text: "Not Submitted",
          modifier: "warning",
          tooltip: `Critiques close at: ${new Date(critique.assignment.critiquesClose).toLocaleString()}`,
          id: "completeBadge",
          isVisible: true,
        });
      } else {
        badges.push({
          text: "Critique Incomplete",
          modifier: "warning",
          tooltip: `Critiques close at: ${new Date(critique.assignment.critiquesClose).toLocaleString()}`,
          id: "completeBadge",
          isVisible: true,
        });
      }
    }
    return badges;
  }
}