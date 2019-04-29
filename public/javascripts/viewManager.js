import {HomeView} from "./homeView";

class AboutView {
}

/**
 * TODO
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

}



let viewManager = undefined;
document.addEventListener("DOMContentLoaded", function () {
    viewManager = new ViewManager();
});