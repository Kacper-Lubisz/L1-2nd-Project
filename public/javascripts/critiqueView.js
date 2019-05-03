/**
 * This view is for editing and submitting critiques.
 */
class CritiqueView extends View {
  constructor(userData, critiqueID) {
    super("/templates/critique.mustache");
    this.userData = userData;

    this.critiqueID = critiqueID;
  }

  /**
     * @inheritDoc
     */
  async getTemplateContext() {

    return this.review;
  }

  /**
     * @inheritDoc
     */
  async onCreate() {

    const [assignmentID, workerID, reviewerID, criticID] = this.critiqueID.match(/.{64}/g);

    if (criticID === this.userData.userID || criticID === undefined) {

      this.review = this.userData.critiques.find((review) =>
        review.assignmentID === assignmentID
                && review.workerID === workerID
                && review.reviewerID === reviewerID);

    } else if (this.userData.isAdmin) {

      viewManager.showErrorModal(
        "Failed to load",
        "Loading critiques as admin isn't implemented",
        "Reload Page",
      );

    }

    if (this.review !== undefined) {

      this.state = {
        critique: {
          assignmentID: assignmentID,
          workerID: workerID,
          reviewerID: reviewerID,
          criticID: criticID === undefined ? this.userData.userID : criticID,
        },
      };

      history.replaceState(this.state,
        `DurPeer Review - ${
          this.review.critique.critic.displayName}'s critique of ${
          this.review.reviewer.displayName}'s review of ${
          this.review.work.worker.displayName}'s work`,
        `/critique/${
          this.review.assignmentID}/${
          this.review.workerID}/${
          this.review.reviewerID}/${
          this.review.critique.criticID}`,
      );

    } else {
      viewManager.showErrorModal(
        "Failed to load",
        "You don't have permission to access this critique",
        "Reload Page",
      );
    }

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
    if (this.review.critique.submissionTime === null) {
      await this.patchCritique(false);
    }
  }

  /**
     * @inheritDoc
     */
  async onResume() {
    this.page = await this.templateAndPushPage();

    const view = this;

    const review = $("#review");
    const reviewCollapseIcon = $("#collapseReviewIcon");
    this.page.find("#collapseReview").on("click", () => {
      review.collapse("toggle");
    });

    review.on("show.bs.collapse", function (event) {
      reviewCollapseIcon.html("expand_less");
    }).on("hide.bs.collapse", function () {
      reviewCollapseIcon.html("expand_more");
    });

    this.page.find(".category").click(function () {
      $(this).find(".criteriaList").collapse("toggle");
    });
    this.page.find(".criteriaList").on("show.bs.collapse", function (event) {
      $(this).parent().find(".collapseCriteriaIcon").html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      $(this).parent().find(".collapseCriteriaIcon").html("expand_more");
      event.stopPropagation();
    });

    this.page.find(".criteria").click(function (event) {
      $(this).find(".grade").collapse("toggle");
      event.stopPropagation();
    });
    this.page.find(".grade").on("show.bs.collapse", function (event) {
      $(this).parent().find(".collapseGradeIcon").html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      $(this).parent().find(".collapseGradeIcon").html("expand_more");
      event.stopPropagation();
    });

    this.page.find(".critique").click(function (event) {
      $(this).find(".critiqueContent").collapse("toggle");
      event.stopPropagation();
    });

    this.page.find(".critiqueContent").on("show.bs.collapse", function (event) {
      $(this).parent().find(".collapseGradeIcon").html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      $(this).parent().find(".collapseGradeIcon").html("expand_more");
      event.stopPropagation();
    });

    this.page.find("#expandIncomplete").click((event) => {
      event.stopPropagation();

      review.collapse("show");

      // first we determine which way to toggle, iff only incomplete are show, then we show all complete
      const allIncomplete =
                this.review.assignment.markingCategories
                  .flatMap((category) => category.markingCriteria)
                  .every((criteria) => !criteria.hasGrade
                        || this.page
                          .find(`#${criteria.categoryID}${criteria.criteriaID}`)
                          .find(".grade.collapse")
                          .hasClass("show") !== criteria.isComplete,
                  ) &&
                this.review.assignment.markingCategories
                  .every((category) => !category.hasGrades
                        || this.page
                          .find(`#${category.categoryID}`)
                          .find(".criteriaList")
                          .hasClass("show") !== category.isComplete,
                  );

      //(allIncomplete ? !criteria.isComplete : criteria.isComplete) === allIncomplete XOR criteria.isComplete

      // TODO optimise this code, the dom is unnecessarily searched for each element twice

      this.review.assignment.markingCategories
        .flatMap((category) => category.markingCriteria)
        .forEach((criteria) => {
          this.page
            .find(`#${criteria.categoryID}${criteria.criteriaID}`)
            .find(".collapse")
            .collapse((allIncomplete ? !criteria.isComplete : criteria.isComplete) ? "hide" : "show");
        });
      this.review.assignment.markingCategories.forEach(async (category) => {
        // when showing complete, we must show a category if ANY of it's criteria is complete and not all
        const show = allIncomplete
          ? category.markingCriteria.some((criteria) => criteria.isComplete)
          : !category.isComplete;
        this.page
          .find(`#${category.categoryID}`)
          .find(".criteriaList")
          .collapse(show ? "show" : "hide");
      });

    });

    this.page.find("#backButton").click(function (event) {
      event.stopPropagation();
      $(this).attr("disabled", true);
      history.back();
    });

    this.page.find(".criteria").find("textArea, input").change(function () {
      const currentJQuery = $(this);
      const parents = currentJQuery.parents();
      const gradeDiv = $(parents[3]);
      const categoryDiv = $(parents[5]);

      const [categoryID, criteriaID] = gradeDiv.attr("id").match(/[0-9a-f]{64}/g);

      const category = view.review.assignment.markingCategories
        .find((category) => category.categoryID === categoryID);
      const criteria = category.markingCriteria.find((criteria) => criteria.criteriaID === criteriaID);

      if (criteria.cGrade === undefined) {
        criteria.cGrade = {
          assignmentID: view.review.assignmentID,
          workerID: view.review.workerID,
          reviewerID: view.review.reviewerID,
          criticID: view.review.critique.criticID,
          categoryID: criteria.categoryID,
          criteriaID: criteria.criteriaID,
          proposedMark: null,
          comment: null,
          state: null,
        };
        view.review.critique.critiquedGrades.push(criteria.cGrade);
      }

      const value = currentJQuery.val();
      if (currentJQuery.prop("tagName") === "TEXTAREA") {
        if (value === "") {
          criteria.cGrade.comment = null;
        } else {
          criteria.cGrade.comment = value;
        }
      } else {
        if (value === "") {
          criteria.cGrade.proposedMark = null;
        } else {
          criteria.cGrade.proposedMark = Math.min(Math.max(Number(value) / 100, 0), 1);
          currentJQuery.val(criteria.cGrade.proposedMark * 100);
        }
      }

      criteria.isComplete = criteria.cGrade.comment !== null
                && criteria.cGrade.comment.length !== 0
                && criteria.cGrade.proposedMark !== null;

      category.isComplete = category.markingCriteria
        .every((criteria) => criteria.isComplete);

      view.review.isComplete = view.review.assignment.markingCategories
        .every((category) => category.isComplete);

      const criteriaBadge = gradeDiv.find(".badge-criteria");
      const categoryBadge = categoryDiv.find(".badge-category");
      const critiqueBadge = view.page.find("#completeBadge");

      criteriaBadge.text(criteria.isComplete ? "Complete" : "Incomplete");
      criteriaBadge.removeClass(`badge-${criteria.isComplete ? "warning" : "success"}`);
      criteriaBadge.addClass(`badge-${criteria.isComplete ? "success" : "warning"}`);

      categoryBadge.text(category.isComplete ? "Complete" : "Incomplete");
      categoryBadge.removeClass(`badge-${category.isComplete ? "warning" : "success"}`);
      categoryBadge.addClass(`badge-${category.isComplete ? "success" : "warning"}`);

      critiqueBadge.text(view.review.isComplete ? "Critique Complete" : "Critique Incomplete");
      critiqueBadge.removeClass(`badge-${view.review.isComplete ? "warning" : "success"}`);
      critiqueBadge.addClass(`badge-${view.review.isComplete ? "success" : "warning"}`);

      view.page.find("#submitButton").attr("disabled", !view.review.isComplete);

    });
    this.page.find("textarea, input").click((event) => {
      event.stopPropagation();
      // this prevents the grades from collapsing when the text area or input is pressed
    });

    this.page.find("#goAssignment").click((event) => {
      event.stopPropagation();
      viewManager.pushView(new AssignmentView(this.userData, this.review.assignmentID));
    });

    this.page.find("#downloadButton").click(async () => {
      await AssignmentView.downloadWork(this.review.work.assignmentID, this.review.workerID);
    });

    this.page.find("#submitButton").click(async function () {

      if (view.review.isComplete) {
        $(this).attr("disabled", true);
        // prevent the button from being double pressed during the animation
        try {
          await view.patchCritique(true);
        } catch (e) {
          viewManager.showErrorModal(
            "Failed to submit critique 💔",
            `Unknown Error: ${e}`,
          );
        }
        await viewManager.popView();
      }
    });

    this.page.find("[data-toggle=\"tooltip\"]").tooltip();

  }

  /**
     * This method will read the state of the current critique from the html elements and then make a patch request to
     * the server which will store this state to the server.  This can permanently submit the critique or can also just
     * save the state.
     * @param willSubmit {Boolean} If the critique is to be submitted
     */
  async patchCritique(willSubmit) {

    const data = {
      assignmentID: this.review.assignmentID,
      workerID: this.review.workerID,
      reviewerID: this.review.reviewerID,
      criticID: this.review.critique.criticID,
      critiquedGrades: this.review.critique.critiquedGrades.map((cGrade) => {
        return {
          categoryID: cGrade.categoryID,
          criteriaID: cGrade.criteriaID,
          comment: cGrade.comment,
          proposedMark: cGrade.proposedMark,
        };
      }),
      submit: willSubmit,
    };

    try {

      // possible crash on not signed in, this should never happen though
      const response = await View.promiseTimeout(fetch("/reviews", {
        method: "PATCH",
        headers: {
          token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }));

      if (response.status !== 200) {
        viewManager.showErrorModal("Failed to save critique",
          `Unknown error occurred, response status ${response.status}`);
      } else if (willSubmit) {
        this.review.critique.submissionTime = await response.json().submissionTime;
      }
    } catch (e) {
      viewManager.showErrorModal();
    }

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
    if (this.review.critique.submissionTime === null) {
      await this.patchCritique(false);
    }
    viewManager.popAllPush(new AboutView());
  }
}