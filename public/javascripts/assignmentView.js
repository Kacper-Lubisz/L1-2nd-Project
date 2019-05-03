/**
 * This class is for the assignment view.  It displays an assignment, it shows: marking categories/criteria; the reviews
 * and critiques that the user wrote for that assignment and any results that the user got.
 */
class AssignmentView extends View {

  constructor(userData, assignmentID) {
    super("/templates/assignment.mustache");
    this.userData = userData;
    this.assignmentID = assignmentID;
  }

  /**
     * @inheritDoc
     */
  async getTemplateContext() {

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

  /**
     * @inheritDoc
     */
  async onCreate() {

    this.assignment = this.userData.assignments.find((assignment) => assignment.assignmentID === this.assignmentID);

    if (this.assignment === undefined && this.userData.isAdmin) {

      viewManager.showErrorModal(
        "Failed to load",
        "Loading any assignment as admin isn't implemented",
        "Reload Page",
      );

    } else if (this.assignment === undefined) {

      viewManager.showErrorModal(
        "Failed to load",
        "Loading this assignment",
        "Reload Page",
      );

    } else {

      this.state = {
        assignment: {
          assignmentID: this.assignment.assignmentID,
        },
      };

      history.pushState(this.state,
        `DurPeer Assignment - ${this.assignment.title}`,
        `/assignment/${this.assignment.assignmentID}`,
      );

    }

    console.log(this.assignment);

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
  }

  /**
     * @inheritDoc
     */
  async onResume() {

    this.page = await this.templateAndPushPage();

    const view = this;

    const marking = this.page.find("#marking");
    const markingIcon = this.page.find("#collapseMarkingIcon");
    this.page.find("#collapseMarking").click(() => {
      marking.collapse("toggle");
    });
    marking.on("show.bs.collapse", function (event) {
      markingIcon.html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      markingIcon.html("expand_more");
      event.stopPropagation();
    });

    const timeline = this.page.find("#timeline");
    const timelineIcon = this.page.find("#collapseTimelineIcon");
    this.page.find("#collapseTimeline").click(() => {
      timeline.collapse("toggle");
    });
    timeline.on("show.bs.collapse", function (event) {
      timelineIcon.html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      timelineIcon.html("expand_more");
      event.stopPropagation();
    });

    const submission = this.page.find("#submission");
    const submissionIcon = this.page.find("#collapseSubmissionIcon");
    this.page.find("#collapseSubmission").click(() => {
      submission.collapse("toggle");
    });
    submission.on("show.bs.collapse", function (event) {
      submissionIcon.html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      submissionIcon.html("expand_more");
      event.stopPropagation();
    });

    const reviews = this.page.find("#reviewsList");
    const reviewsIcon = this.page.find("#collapseReviewsIcon");
    this.page.find("#collapseReviews").click(() => {
      reviews.collapse("toggle");
    });
    reviews.on("show.bs.collapse", function (event) {
      reviewsIcon.html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      reviewsIcon.html("expand_more");
      event.stopPropagation();
    });

    const critiques = this.page.find("#critiquesList");
    const critiquesIcon = this.page.find("#collapseCritiquesIcon");
    this.page.find("#collapseCritiques").click(() => {
      critiques.collapse("toggle");
    });
    critiques.on("show.bs.collapse", function (event) {
      critiquesIcon.html("expand_less");
      event.stopPropagation();
    }).on("hide.bs.collapse", function (event) {
      critiquesIcon.html("expand_more");
      event.stopPropagation();
    });

    const addToCalendarButton = this.page.find("#addToCalendar");
    addToCalendarButton.click(() => {
      gapi.auth2.getAuthInstance().currentUser.get().grant(new gapi.auth2.SigninOptionsBuilder({
        scope: "email https://www.googleapis.com/auth/calendar.events",
      })).then(async () => {

        const events = [{
          start: this.assignment.submissionOpen,
          end: this.assignment.submissionClose,
          description: "The submission period of the assignment",
          title: "Submissions",
        }, {
          start: this.assignment.reviewsOpen,
          end: this.assignment.reviewsClose,
          description: "The review period of the assignment",
          title: "Reviews",
        }, {
          start: this.assignment.critiquesOpen,
          end: this.assignment.critiquesClose,
          description: "The critique period of the assignment",
          title: "Critiques",
        }, {
          start: this.assignment.resultsPublish,
          end: this.assignment.resultsPublish,
          description: "The results publish at this time",
          title: "Results",
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
            },
          }));
        }

        batchInsert.then((result) => {
          if (result.status === 200) {
            viewManager.showErrorModal(
              "Events added to your calendar 📅",
              "Events were successfully added!",
              "Ok",
              () => {
              },
            );
          } else {
            viewManager.showErrorModal(
              "Failed to add events to your calendar",
              "An unknown error occurred.",
              "Try Again",
              () => {
              },
              () => {
                addToCalendarButton.click();
              },
            );
          }
        });
      }, () => {
        viewManager.showErrorModal(
          "Couldn't add to calendar",
          "Couldn't get the permissions needed to add to your calendar",
          "Try Again",
          () => {
          },
          () => {
            addToCalendarButton.click();
          },
        );
      });

    });

    this.page.find(".category").each(function () {
      const criteriaList = $(this).find("#criteriaList");
      const collapseIcon = $(this).find("#collapseCriteriaIcon");
      $(this).click(function (event) {
        event.stopPropagation();
        criteriaList.collapse("toggle");
      });
      criteriaList.on("show.bs.collapse", function (event) {
        collapseIcon.html("expand_less");
        event.stopPropagation();
      }).on("hide.bs.collapse", function (event) {
        collapseIcon.html("expand_more");
        event.stopPropagation();
      });
    });

    this.page.find(".criteria").each(function () {
      const icon = $(this).find(".collapseReviewIcon");
      const list = $(this).find(".gradeList");
      list.on("show.bs.collapse", function (event) {
        event.stopPropagation();
        icon.html("expand_less");
      }).on("hide.bs.collapse", function (event) {
        event.stopPropagation();
        icon.html("expand_more");
      });
      $(this).click(function (event) {
        event.stopPropagation();
        if (view.assignment.resultsPublished) {
          list.collapse("toggle");
        }
      });
    });

    this.page.find(".grade").each(function () {
      const icon = $(this).find(".collapseGradeIcon");
      const list = $(this).find(".reviewContent");
      list.on("show.bs.collapse", function (event) {
        event.stopPropagation();
        icon.html("expand_less");
      }).on("hide.bs.collapse", function (event) {
        event.stopPropagation();
        icon.html("expand_more");
      });
      $(this).click(function (event) {
        event.stopPropagation();
        if (view.assignment.resultsPublished) {
          list.collapse("toggle");
        }
      });
    });

    this.page.find(".cGrade").each(function () {
      const icon = $(this).find(".collapseCritiqueIcon");
      const list = $(this).find(".critiqueContent");
      list.on("show.bs.collapse", function (event) {
        event.stopPropagation();
        icon.html("expand_less");
      }).on("hide.bs.collapse", function (event) {
        event.stopPropagation();
        icon.html("expand_more");
      });
      $(this).click(function (event) {
        event.stopPropagation();
        if (view.assignment.resultsPublished) {
          list.collapse("toggle");
        }
      });
    });

    this.page.find(".review").each(function () {
      const icon = $(this).find(".collapseCommentIcon");
      const list = $(this).find(".critiquesList");
      list.on("show.bs.collapse", function (event) {
        event.stopPropagation();
        icon.html("expand_less");
      }).on("hide.bs.collapse", function (event) {
        event.stopPropagation();
        icon.html("expand_more");
      });
      $(this).click(function (event) {
        event.stopPropagation();
        if (view.assignment.resultsPublished) {
          list.collapse("toggle");
        }
      });
    });

    this.page.find("input, textarea, .critique").click(function (event) {
      event.stopPropagation();
    });

    this.page.find(".onlyReview").click(function (event) {
      event.stopPropagation();

      view.page.find(".category, .criteria").collapse("show");

      const reviewerID = $(this).parent().parent().attr("id");
      const reviews = view.page.find(".grade");

      const correctlyOpenReviews = reviews.filter(function () {
        const currentReviewerID = $(this).attr("id").substr(128, 64);
        const shouldBeShown = currentReviewerID === reviewerID;
        return $(this).find(".reviewContent").hasClass("show") === shouldBeShown;
      });

      const isCorrect = correctlyOpenReviews.length === reviews.length; // all of them

      reviews.each(function () {
        const currentReviewerID = $(this).attr("id").substr(128, 64);

        const shouldShow = currentReviewerID === reviewerID;
        $(this).find(".reviewContent")
          .collapse((shouldShow || isCorrect) ? "show" : "hide");
      });

    });

    this.page.find(".onlyCritique").click(function (event) {
      event.stopPropagation();

      view.page.find(".category").each(function () {
        $(this).collapse("show");
      });

      const ids = $(this).parent().parent().attr("id");

      const reviewerID = ids.substr(0, 64);
      const criticID = ids.substr(64, 64);

      const reviews = view.page.find(".grade");
      const critiques = view.page.find(".cGrade");

      const correctlyOpenReviews = reviews.filter(function () {
        const currentReviewerID = $(this).attr("id").substr(128, 64);
        const shouldBeShown = currentReviewerID === reviewerID;
        return $(this).find(".reviewContent").hasClass("show") === shouldBeShown;
      });
      const correctlyOpenCritiques = critiques.filter(function () {
        const currentReviewerID = $(this).attr("id").substr(128, 64);
        const currentCriticID = $(this).attr("id").substr(192, 64);
        const shouldBeShown = currentReviewerID === reviewerID && currentCriticID === criticID;
        return $(this).find(".reviewContent").hasClass("show") === shouldBeShown;
      });

      const isCorrect = correctlyOpenReviews.length === reviews.length
                && correctlyOpenCritiques.length === critiques.length;

      reviews.each(function () {
        const currentReviewerID = $(this).attr("id").substr(128, 64);

        const shouldShow = currentReviewerID === reviewerID;
        $(this).find(".reviewContent").collapse((shouldShow || isCorrect) ? "show" : "hide");

      });

      critiques.each(function () {
        const currentReviewerID = $(this).attr("id").substr(128, 64);
        const currentCriticID = $(this).attr("id").substr(192, 64);

        const shouldShow = currentReviewerID === reviewerID && currentCriticID === criticID;
        $(this).find(".critiqueContent").collapse((shouldShow || isCorrect) ? "show" : "hide");
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
        formData.append("file", fileInput.get(0).files[0]);
        formData.append("workerID", this.userData.userID);
        formData.append("assignmentID", this.assignment.assignmentID);

        try {
          const response = await View.promiseTimeout(fetch("/work", {
            method: "POST",
            body: formData,
            headers: {token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token},
          }));
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
            viewManager.showErrorModal(
              "Failed to submit work",
              `Status code ${response.status}`,
            );
          }
        } catch (e) {
          viewManager.showErrorModal();
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
      await AssignmentView.downloadWork(this.assignment.assignmentID, this.userData.userID);
    });

    this.page.find(".ownReview").each(function () {
      $(this).click(function () {
        viewManager.pushView(new ReviewView(view.userData, $(this).attr("id")));
      });
    });

    this.page.find(".ownCritique").each(function () {
      $(this).click(function () {
        viewManager.pushView(new CritiqueView(view.userData, $(this).attr("id")));
      });
    });

    this.page.find("#newReview").click(async function (event) {
      event.stopPropagation();

      $(this).attr("disabled", true);

      const data = {
        assignmentID: view.assignment.assignmentID,
        reviewerID: view.userData.userID,
      };

      try {
        const response = await View.promiseTimeout(fetch("/reviews", {
          method: "POST",
          headers: {
            token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }));

        if (response.status === 200) {

          const newReview = await response.json();

          const assignmentsMap = {};
          view.userData.assignments.forEach(assignment => {
            assignmentsMap[assignment.assignmentID] = assignment;
          });
          HomeView.processReview(newReview, new Date().getTime(), assignmentsMap);

          view.userData.reviews.push(newReview);
          viewManager.pushView(new ReviewView(view.userData, newReview.assignmentID + newReview.workerID));

        } else if (response.status === 503) {
          viewManager.showErrorModal(
            "Failed to make a new review 😢",
            "This is because there is no more work that you haven't reviewed yet! " +
                        "If submissions are open, Try again later!",
            "Ok",
            () => {
            },
          );
        } else {
          viewManager.showErrorModal(
            "Unknown Error Occurred",
            `Status code ${request.status}`,
          );
        }
      } catch (e) {
        viewManager.showErrorModal();
      }

    }).attr("disabled", !this.assignment.reviewsOpen);
    this.page.find("#newCritique").click(async function (event) {
      event.stopPropagation();

      $(this).attr("disabled", true);

      const data = {
        assignmentID: view.assignment.assignmentID,
        criticID: view.userData.userID,
      };

      try {

        const response = await View.promiseTimeout(fetch("/reviews", {

          method: "POST",
          headers: {
            token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }));

        if (response.status === 200) {

          const newCritique = await response.json();

          const assignmentsMap = {};
          view.userData.assignments.forEach(assignment => {
            assignmentsMap[assignment.assignmentID] = assignment;
          });
          HomeView.processCritique(newCritique, new Date().getTime(), assignmentsMap);

          view.userData.critiques.push(newCritique);
          viewManager.pushView(new CritiqueView(
            view.userData,
            newCritique.assignmentID + newCritique.workerID + newCritique.reviewerID,
          ));

        } else if (response.status === 503) {
          viewManager.showErrorModal(
            "Failed to make a new critique 😢",
            "This is because there is no more work that you haven't reviewed yet! " +
                        "If submissions are open, Try again later!",
            "Ok",
            () => {
            },
          );
        } else {
          viewManager.showErrorModal(
            "Unknown Error Occurred",
            `Status code ${request.status}`,
          );
        }
      } catch (e) {
        viewManager.showErrorModal();
      }

    }).attr("disabled", !this.assignment.critiquesOpen);

    this.page.find("#backButton").click(function (event) {
      event.stopPropagation();
      $(this).attr("disabled", true);
      history.back();
    });

    this.page.find("[data-toggle=\"tooltip\"]").tooltip();
  }


  /**
     * This method causes the browser to download the specified piece of work.  This function could fail for two
     * reasons: If the work isn't present on the server or if the current signed in user doesn't have access to this
     * work
     * @param assignmentID
     * @param workerID
     */
  static async downloadWork(assignmentID, workerID) {

    if(gapi.auth2)

      try {

        const request = await View.promiseTimeout(fetch(`/work/${assignmentID}/${workerID}`, {
          headers: {token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token},
        }));

        if (request.status === 200) {
          const blob = await request.blob();
          download(blob, assignmentID + "-" + workerID, "application/zip");
        } else if (request.status === 404) {
          viewManager.showErrorModal(
            "Error 404",
            "The work doesn't exist on the server and is because of data inconsistency! " +
                    "(the test data isn't perfectly consistent 😢)",
            "Try again",
            () => {
            },
            async (dialogClose) => {
              await dialogClose;
              this.page.find("#downloadButton").click();
            },
          );
        } else {
          viewManager.showErrorModal(
            "Unknown Error Occurred",
            `Status code ${request.status}`,
          );
        }

      } catch (e) {
        console.log(e);
        viewManager.showErrorModal();
      }
  }

  async onSignIn() {
    // This should never happen, should always be signed in
  }

  async onSignOut() {
    viewManager.popAllPush(new AboutView());
  }

}