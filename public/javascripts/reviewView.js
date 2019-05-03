class ReviewView extends View {

  constructor(userData, reviewID) {
    super("/templates/review.mustache");
    this.userData = userData;

    this.reviewID = reviewID;
  }

  async getTemplateContext() {

    return this.review;
  }


  async onCreate() {

    const [assignmentID, workerID, reviewerID] = this.reviewID.match(/.{64}/g);

    if (reviewerID === this.userData.userID || reviewerID === undefined) {

      this.review = this.userData.reviews.find((review) => review.assignmentID === assignmentID
                && review.workerID === workerID);

    } else if (this.userData.isAdmin) {

      viewManager.showErrorModal(
        "Failed to load",
        "Loading critiques as admin isn't implemented",
        "Reload Page",
      );

    }

    if (this.review !== undefined) {

      this.state = {
        review: {
          assignmentID: assignmentID,
          workerID: workerID,
          reviewerID: reviewerID,
        },
      };
      history.pushState(this.state,
        `DurPeer Review - ${
          this.review.reviewer.displayName}'s review of ${
          this.review.work.worker.displayName}'s work`,
        `/review/${
          this.review.assignmentID}/${
          this.review.workerID}/${
          this.review.reviewerID}`,
      );
    } else {
      viewManager.showErrorModal(
        "Failed to load",
        "You don't have permission to access this review",
        "Reload Page",
      );
    }

  }

  async onDestroy() {
  }

  async onPause() {
    if (this.review.submissionTime === null) {
      await this.patchReview(false);
    }
  }

  async onResume() {
    this.page = await this.templateAndPushPage();

    const review = $("#review");
    const reviewCollapseIcon = $("#collapseReviewIcon");
    this.page.find("#collapseReview").on("click", () => {
      review.collapse("toggle");
    });

    review.on("show.bs.collapse", function (event) {
      event.stopPropagation();
      reviewCollapseIcon.html("expand_less");
    }).on("hide.bs.collapse", function (event) {
      event.stopPropagation();
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

    // note that I mix arrow functions and normal functions because they have different behaviour
    // when using an arrow function `this` will be the same as `this` outside the function, this isn't the case for
    // normal functions, where `this` refers to the dom object on which the listener is called
    const view = this;
    this.page.find(".criteria").find("textArea, input").change(function () {
      const currentJQuery = $(this);
      const parents = currentJQuery.parents();
      const gradeDiv = $(parents[3]);
      const categoryDiv = $(parents[5]);

      const [categoryID, criteriaID] = gradeDiv.attr("id").match(/[0-9a-f]{64}/g);

      const category = view.review.assignment.markingCategories
        .find((category) => category.categoryID === categoryID);
      const criteria = category.markingCriteria.find((criteria) => criteria.criteriaID === criteriaID);

      if (criteria.grade === undefined) {
        criteria.grade = {
          workerID: view.review.workerID,
          reviewerID: view.review.reviewerID,
          assignmentID: view.review.assignmentID,
          categoryID: criteria.categoryID,
          criteriaID: criteria.criteriaID,
          mark: null,
          comment: null,
        };
        view.review.grades.push(criteria.grade);
      }

      if (currentJQuery.prop("tagName") === "TEXTAREA") {
        if (currentJQuery.val() === "") {
          criteria.grade.comment = null;
        } else {
          criteria.grade.comment = currentJQuery.val();
        }
      } else {
        if (currentJQuery.val() === "") {
          criteria.grade.mark = null;
        } else {
          criteria.grade.mark = Math.min(Math.max(Number(currentJQuery.val()) / 100, 0), 1);
          currentJQuery.val(criteria.grade.mark * 100);
        }
      }

      criteria.isComplete = criteria.grade.comment !== null
                && criteria.grade.comment.length !== 0
                && criteria.grade.mark !== null;

      category.isComplete = category.markingCriteria.every((criteria) => criteria.isComplete);

      view.review.isComplete = view.review.comment !== null
                && view.review.comment.length !== 0
                && view.review.assignment.markingCategories.every((category) => category.isComplete);

      const criteriaBadge = gradeDiv.find(".badge");
      const categoryBadge = categoryDiv.find(".badge-category");
      const reviewBadge = view.page.find("#completeBadge");

      criteriaBadge.text(criteria.isComplete ? "Complete" : "Incomplete");
      criteriaBadge.removeClass(`badge-${criteria.isComplete ? "warning" : "success"}`);
      criteriaBadge.addClass(`badge-${criteria.isComplete ? "success" : "warning"}`);

      categoryBadge.text(category.isComplete ? "Complete" : "Incomplete");
      categoryBadge.removeClass(`badge-${category.isComplete ? "warning" : "success"}`);
      categoryBadge.addClass(`badge-${category.isComplete ? "success" : "warning"}`);

      reviewBadge.text(view.review.isComplete ? "Review Complete" : "Review Incomplete");
      reviewBadge.removeClass(`badge-${view.review.isComplete ? "warning" : "success"}`);
      reviewBadge.addClass(`badge-${view.review.isComplete ? "success" : "warning"}`);

      view.page.find("#submitButton").attr("disabled", !view.review.isComplete);

    });

    this.page.find("textarea, input").click((event) => {
      event.stopPropagation();
      // this prevents the grades from collapsing when the text area or input is pressed
    });

    this.page.find("#downloadButton").click(async () => {
      await AssignmentView.downloadWork(this.review.assignmentID, this.review.workerID);
    });

    this.page.find("#expandCritiques").click((event) => {
      event.stopPropagation();

      review.collapse("show", this.review.hasPending);

      const allPending = !this.review.hasPending ||
                this.review.assignment.markingCategories
                  .flatMap((category) => category.markingCriteria)
                  .flatMap((criteria) => criteria.cGrades === undefined ? [] : criteria.cGrades)
                  .every((cGrade) => {
                    const element = this.page
                      .find(`#${cGrade.categoryID}${cGrade.criteriaID}${cGrade.criticID}`)
                      .find(".critiqueContent.collapse");
                    return element.is(":hidden") || element.hasClass("show") === cGrade.isPending;
                  }) &&
                this.review.assignment.markingCategories
                  .flatMap((category) => category.markingCriteria)
                  .every((criteria) =>
                    this.page
                      .find(`#${criteria.categoryID}${criteria.criteriaID}`)
                      .find(".grade.collapse")
                      .hasClass("show") === criteria.hasPending,
                  ) &&
                this.review.assignment.markingCategories
                  .every((category) =>
                    this.page
                      .find(`#${category.categoryID}`)
                      .find(".criteriaList")
                      .hasClass("show") === category.hasPending,
                  );

      // TODO optimise this code, the dom is unnecessarily searched for each element twice

      this.review.assignment.markingCategories
        .flatMap((category) => category.markingCriteria)
        .flatMap((criteria) => criteria.cGrades === undefined ? [] : criteria.cGrades)
        .forEach((cGrade) =>
          this.page
            .find(`#${cGrade.categoryID}${cGrade.criteriaID}${cGrade.criticID}`)
            .find(".critiqueContent.collapse")
            .collapse((allPending || cGrade.isPending) ? "show" : "hide"),
        );
      this.review.assignment.markingCategories
        .flatMap((category) => category.markingCriteria)
        .forEach((criteria) => {
          this.page
            .find(`#${criteria.categoryID}${criteria.criteriaID}`)
            .find(".grade.collapse")
            .collapse((allPending || criteria.hasPending) ? "show" : "hide");
        });
      this.review.assignment.markingCategories.forEach(async (category) => {
        // when showing complete, we must show a category if ANY of it's criteria is complete and not all

        this.page
          .find(`#${category.categoryID}`)
          .find(".criteriaList")
          .collapse((allPending || category.hasPending) ? "show" : "hide");
      });

    });

    this.page.find("#expandIncomplete").click((event) => {
      event.stopPropagation();

      review.collapse("show");

      // first we determine which way to toggle, iff only incomplete are show, then we show all complete

      const allIncomplete =
                this.review.assignment.markingCategories
                  .flatMap((category) => category.markingCriteria)
                  .every((criteria) =>
                    this.page
                      .find(`#${criteria.categoryID}${criteria.criteriaID}`)
                      .find(".critique.collapse")
                      .hasClass("show") !== criteria.isComplete,
                  ) &&
                this.review.assignment.markingCategories
                  .every((category) =>
                    this.page
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

    this.page.find("#generalComment").change(function () {

      const comment = $(this).val();
      if (comment.trim().length === 0) {
        view.review.comment = null;
      } else {
        view.review.comment = comment;
      }


      const commentComplete = view.review.comment !== undefined && view.review.comment.length !== 0;
      view.review.isComplete = commentComplete
                && view.review.assignment.markingCategories.every((category) => category.isComplete);

      const commentBadge = view.page.find("#commentComplete");
      const reviewBadge = view.page.find("#completeBadge");

      commentBadge.text(commentComplete ? "Complete" : "Incomplete");
      commentBadge.removeClass(`badge-${commentComplete ? "warning" : "success"}`);
      commentBadge.addClass(`badge-${commentComplete ? "success" : "warning"}`);

      reviewBadge.text(view.review.isComplete ? "Review Complete" : "Review Incomplete");
      reviewBadge.removeClass(`badge-${view.review.isComplete ? "warning" : "success"}`);
      reviewBadge.addClass(`badge-${view.review.isComplete ? "success" : "warning"}`);

      view.page.find("#submitButton").attr("disabled", !view.review.isComplete);

    });

    this.page.find("#submitButton").click(async function () {
      if (view.review.isComplete) {
        $(this).attr("disabled", true);
        // prevent the button from being double pressed during the animation
        try {
          await view.patchReview(true);
        } catch (e) {
          viewManager.showErrorModal(
            "Failed to submit critique 💔",
            `Unknown Error: ${e}`,
          );
        }
        await viewManager.popView();
      }
    });

    this.page.find(".showMoreCritiques").click(function (event) {
      event.stopPropagation();

      const moreButton = $(this);
      const criteriaDiv = $(moreButton.parents()[2]);

      moreButton.hide();
      criteriaDiv.find(".moreGrade").show();
    });

    this.page.find(".acceptButton, .rejectButton").click(async function (event) {
      event.stopPropagation();

      const currentButton = $(this);
      const accept = currentButton.hasClass("acceptButton");

      const buttonContainer = currentButton.parent().parent();
      buttonContainer.find(".btn").attr("disabled", true);
      buttonContainer.collapse("hide");

      const critiqueContainer = buttonContainer.parent().parent();
      critiqueContainer.find(".pendingBadge").hide();
      critiqueContainer.find(accept ? ".acceptBadge" : ".rejectBadge").show();

      const [categoryID, criteriaID, criticID] = critiqueContainer.attr("id").match(/[0-9a-f]{64}/g);
      const category = view.review.assignment.markingCategories
        .find((category) => category.categoryID === categoryID);
      const criteria = category.markingCriteria.find((criteria) => criteria.criteriaID === criteriaID);
      const cGrade = criteria.cGrades.find((cGrade) => cGrade.criticID === criticID);

      cGrade.isPending = false;
      cGrade.state = accept ? 2 : 3;
      cGrade.isRejected = !accept;
      cGrade.isAccepted = accept;

      const criteriaBadge = $(critiqueContainer.parents()[2]).find(".badge-criteria");
      const categoryBadge = $(critiqueContainer.parents()[4]).find(".badge-category");

      const pendingBadge = view.page.find("#pendingBadge");
      const critiqueBadge = view.page.find("#critiqueBadge");

      criteria.hasPending = criteria.cGrades.some((cGrade) => cGrade.isPending);
      category.hasPending = category.markingCriteria.some((criteria) => criteria.hasPending);
      view.review.hasPending = view.review.assignment.markingCategories.some((category) => category.hasPending);

      if (!criteria.hasPending) {
        criteriaBadge.hide();
      }
      if (!category.hasPending) {
        categoryBadge.hide();
      }
      if (!view.review.hasPending) {
        pendingBadge.hide();
        critiqueBadge.show();
      }

      critiqueContainer.find(".critiqueContent ").collapse("hide");

      const data = {
        assignmentID: view.review.assignmentID,
        workerID: view.review.workerID,
        reviewerID: view.review.reviewerID,
        criticID: criticID,
        categoryID: categoryID,
        criteriaID: criteriaID,
        state: cGrade.state,
      };

      try {
        const response = await View.promiseTimeout(fetch("/critiques", {
          method: "POST",
          headers: {
            token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }));

        if (response.status !== 200) {
          viewManager.showErrorModal(
            "Failed to process critique",
            `Unknown error occurred, response status ${response.status}`,
          );
        }
      } catch (e) {
        viewManager.showErrorModal();
      }

    });

    this.page.find("#goAssignment").click((event) => {
      event.stopPropagation();
      viewManager.pushView(new AssignmentView(this.userData, this.review.assignmentID));
    });

    this.page.find("#backButton").click(function (event) {
      event.stopPropagation();
      $(this).attr("disabled", true);
      history.back();
    });

    this.page.find("[data-toggle=\"tooltip\"]").tooltip();
  }

  async patchReview(willSubmit) {

    const data = {
      assignmentID: this.review.assignmentID,
      workerID: this.review.workerID,
      reviewerID: this.review.reviewerID,
      grades: this.review.grades.map((grade) => {
        return {
          categoryID: grade.categoryID,
          criteriaID: grade.criteriaID,
          comment: grade.comment,
          mark: grade.mark,
        };
      }),
      comment: this.review.comment,
      submit: willSubmit,
    };

    try {
      const response = await View.promiseTimeout(fetch("/reviews", {
        method: "PATCH",
        headers: {
          token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }));

      if (response.status !== 200) {
        viewManager.showErrorModal("Failed to save review",
          `Unknown error occurred, response status ${response.status}`);
      } else if (willSubmit) {
        this.review.submissionTime = await response.json().submissionTime;
      }
    } catch (e) {
      viewManager.showErrorModal();
    }

  }

  async onSignIn() {
    // This should never happen, should always be signed in
  }

  async onSignOut() {
    if (this.review.submissionTime === null) {
      await this.patchReview(false);
    }
    await viewManager.popAllPush(new AboutView());
  }
}
