/**
 * This class is responsible for managing the page.  It only only manages the life cycle of views, but also manages
 * log ins and the browser history
 */
class ViewManager {

  /**
     * Instantiates the singleton ViewManager object
     */
  constructor() {

    this.modal = $("#modal");
    this.modalTitle = this.modal.find(".modal-title");
    this.modalBody = this.modal.find(".modal-body");
    this.modalAcceptButton = this.modal.find(".btn-primary");
    this.modalAcceptButton.click(() => {
      if (this.modalOnAccept !== undefined) {
        this.modalOnAccept(this.modalClosePromise);
      }
      this.modal.modal("hide");
    });
    this.modalOnDismiss = () => {
    };

    this.modal.on("hide.bs.modal", () => {
      this.modalOnDismiss(this.modalClosePromise);
    });

    this.modalClosePromise = undefined;
    this.modalCloseResolve = undefined;
    this.modal.on("show.bs.modal", () => {
      this.modalClosePromise = new Promise(((resolve) => {
        this.modalCloseResolve = resolve;
      }));
    });
    this.modal.on("hidden.bs.modal", () => {
      this.modalCloseResolve();
    });

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
      await this.onSignOut();

      const auth2 = gapi.auth2.getAuthInstance();
      await auth2.signOut();
      console.log("User signed out.");
    });

    $("#homeText").click(() => {
      if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        manager.popAllPush(new HomeView(this.userData));
      } else {
        manager.popAllPush(new AboutView());
      }
    });

    const manager = this;
    gapi.load("client:auth2", async function () {
      await new Promise(function (resolve) {
        gapi.client.init({
          client_id: "491064171495-35kum91vn1gd6mkil5ve3h82fph9a5pa.apps.googleusercontent.com",
          apiKey: "AIzaSyCu90pfiOTnhZxHMKVHogqzlsk_W29gTac",
          scope: "profile",
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        }).then(() => resolve());
      });

      const auth = gapi.auth2.getAuthInstance();

      auth.isSignedIn.listen(function (loggedIn) {
        if (loggedIn) {
          manager.onSignIn();
        }
      });

      if (auth.isSignedIn.get()) {
        const userData = await manager.onSignIn();

        if (location.pathname === "/about") {
          await manager.popAllPush(new AboutView());
        } else if (location.pathname.match(/^\/assignment\/[0-9a-f]{64}$/)) {

          const ids = location.pathname.match(/\/[^\/]*/g)
            .map(section => section.substr(1))
            .filter(section => section !== "assignment")
            .reduce((a, b) => a + b);

          await manager.popAllPush([
            new HomeView(userData),
            new AssignmentView(userData, ids),
          ]);
        } else if (location.pathname.match(/^\/review(\/[0-9a-f]{64}){3}$/)) {
          const ids = location.pathname.match(/\/[^\/]*/g)
            .map(section => section.substr(1))
            .filter(section => section !== "review")
            .reduce((a, b) => a + b);

          await manager.popAllPush([
            new HomeView(userData),
            new ReviewView(userData, ids),
          ]);

        } else if (location.pathname.match(/^\/critique(\/[0-9a-f]{64}){4}$/)) {
          const ids = location.pathname.match(/\/[^\/]*/g)
            .map(section => section.substr(1))
            .filter(section => section !== "critique")
            .reduce((a, b) => a + b);

          await manager.popAllPush([
            new HomeView(userData),
            new CritiqueView(userData, ids),
          ]);

        } else {
          await manager.popAllPush(new HomeView(userData));
        }

      } else {
        await manager.popAllPush(new AboutView());
      }
    });

    window.addEventListener("popstate", async (event) => {


      event.stopPropagation();
      event.preventDefault();

      if (this.viewStack[this.viewStack.length - 2] !== undefined
                && ViewManager.areEqual(this.viewStack[this.viewStack.length - 2].state, event.state)
      ) {
        await this.popView(1, false);

      } else if (event.state.about !== undefined) {
        await this.popAllPush(new AboutView());

      } else if (event.state.assignment !== undefined) {
        await this.pushView(new AssignmentView(this.userData, event.state.assignment.assignmentID));

      } else if (event.state.review !== undefined) {
        await this.pushView(new ReviewView(
          this.userData,
          event.state.review.assignmentID + event.state.review.workerID,
        ));

      } else if (event.state.critique !== undefined) {
        await this.pushView(new CritiqueView(
          this.userData,
          event.state.critique.assignmentID
                    + event.state.critique.workerID
                    + event.state.critique.reviewerID,
        ));
      }
    });
    this.state = {
      home: {},
    };


  }


  /**
     * This is a (none perfect) element wise object comparison of objects (as opposed to pointer comparisons).
     * This function doesn't consider the exceptional case of functions stored in the object.
     *
     * @param a {Object} The first object
     * @param b {Object} The second object
     * @return {boolean} If the objects are the same
     */
  static areEqual(a, b) {

    for (let p in a) {

      if (a.hasOwnProperty(p) !== b.hasOwnProperty(p)) return false;

      if (typeof a[p] === "object") {
        if (!ViewManager.areEqual(a[p], b[p])) {
          return false;
        }
      } else {
        if (a[p] !== b[p]) {
          return false;
        }

      }
    }
    for (let p in b) {
      if (typeof (a[p]) == "undefined") {
        return false;
      }
    }
    return true;

  }

  /**
     * This method is called when the user signs out
     */
  async onSignOut() {

    this.signOutButton.hide();
    this.userDetailsDiv.hide();
    this.username.text("");
    this.userIcon.attr("src", "");

    this.signInButton.show();

    const currentView = this.viewStack[this.viewStack.length - 1];
    if (currentView !== undefined) {
      await currentView.onSignOut();
    }

  }

  /**
     * This method is called when the user signs in
     */
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

    try {
      const userDataRequest = await View.promiseTimeout(fetch(`/users?email=${encodeURI(profile.getEmail())}`, {
        headers: {
          token: googleUser.getAuthResponse().id_token,
        },
      }));
      if (userDataRequest.status !== 200) {
        this.showErrorModal(
          `Unexpected Error ${userDataRequest.status} occurred`,
          "Failed to load user data");
      } else {
        this.userData = await userDataRequest.json();

        this.username.text(`${this.userData.displayName} (${profile.getGivenName()}${
          this.userData.isAdmin ? ", Admin" : ""
        })`);
        this.userIcon.attr("src", this.userData.identicon);

        const currentView = this.viewStack[this.viewStack.length - 1];
        if (currentView !== undefined) {
          await currentView.onSignIn(this.userData);
        }
        return this.userData;
      }
    } catch (e) {
      this.showErrorModal();
    }
  }

  /**
     * This method displays an error modal (pop up dialog box)
     * @param title {String} The title of the dialog
     * @param content {String} The content of the dialog box
     * @param acceptText {String} The text on the accept button
     * @param onDismiss {Function} A callback for when the user dismisses the dialog
     * @param onAccept {Function} A callback for when the user presses the accept button
     */
  showErrorModal(
    title = "Couldn't Reach Server",
    content = "A request to the server timed out. Please try again later!",
    acceptText = "Reload Page",
    onDismiss = () => location.reload(),
    onAccept = onDismiss,
  ) {

    this.modalTitle.text(title);
    this.modalBody.text(content);
    this.modalAcceptButton.text(acceptText);
    this.modalOnDismiss = onDismiss;
    this.modalOnAccept = onAccept;

    this.modal.modal("show");

  }

  /**
     * This method pushes a new view or list of views to the top of the stack.  This method also invokes all the
     * appropriate life cycle calls on the relevant views.
     * @param nextView {View | View[]} The views to be pushed
     * @throws {Error} when popping is already happening
     * @throws {Error} if the object(s) that are being pushed are not of type View
     */
  async pushView(nextView) {

    if (this.isPopping) {
      throw Error("Can't push views while a pop is happening");
    }
    this.isPushing = true;

    if (this.viewStack.length !== 0) {
      await this.viewStack[this.viewStack.length - 1].onPause();
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
      await view.onCreate();
    }
    if (this.viewStack[this.viewStack.length - 1] === nextView[nextView.length - 1]) {
      // this is to take care of the case where views are pushed from inside onCreate
      await nextView[nextView.length - 1].onResume();
    }

    this.isPushing = false;
  }

  /**
     * This method is for removing views from the top of the stack.  It also calls the appropriate life cycle methods on
     * relevant views
     * @param number {Number} The number of views that are to be popped
     * @throws {Error} if pushing is already happening
     */
  async popView(number = 1) {

    if (this.isPushing) {
      throw Error("Can't pop views while a push is happening");
    }
    this.isPopping = true;

    if (number > this.viewStack.length - 1) {
      throw Error("Can't pop the home view");
    }

    await this.viewStack[this.viewStack.length - 1].onPause();
    for (let i = 0; i < number; i++) {
      const top = this.viewStack.pop();
      await top.onDestroy();
    }
    await this.viewStack[this.viewStack.length - 1].onResume();

    this.isPopping = false;

  }

  /**
     * This method pops all the views that are currently on the stack and then pushes the view(s) that are passed onto
     * it. It also calls the appropriate life cycle methods on
     * relevant views
     * @param nextView {View|View[]} The view(s) that are to be placed on the top of the stack after the current views
     * are popped
     * @return {Promise<void>}
     */
  async popAllPush(nextView) {

    if (this.isPushing || this.isPopping) {
      throw Error("Can't popPush views while a push or pulling is happening");
    }
    this.isPopping = true;
    this.isPushing = true;

    if (this.viewStack.length !== 0) {
      const top = this.viewStack.pop();
      await top.onPause();
      await top.onDestroy();
    }

    while (this.viewStack.length !== 0) {
      const top = this.viewStack.pop();
      await top.onDestroy();
    }

    if (!Array.isArray(nextView)) {
      nextView = [nextView];
    } else if (nextView.length === 0) {
      throw Error("Can't pop push an empty array of views");
    }

    for (let view of nextView) {
      if (!(view instanceof View)) {
        throw Error("Can only push objects of type view");
      }
      this.viewStack.push(view);
      view.manager = this;
      await view.onCreate();
    }
    await nextView[nextView.length - 1].onResume();

    this.isPopping = false;
    this.isPushing = false;

  }

}

/**
 * This is the global declaration of the viewManager object
 * @type {ViewManager}
 */
let viewManager = undefined;
document.addEventListener("DOMContentLoaded", function () {
  viewManager = new ViewManager();
});