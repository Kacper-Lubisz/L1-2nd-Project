/**
 * This class is used for managing templates. It manages loading them, templating and then displaying them
 */
class ViewManager {

    constructor(views) {
        this.views = views;
        Object.values(views).forEach((view) => view.viewManager = this);
        this.currentView = undefined;
    }

    async loadFromURL(url, onFail) {
        const nextView = Object.values(this.views).find(template => template.isValidURL(url));
        if (nextView === undefined) {
            onFail();
        } else {

            if (this.currentView !== undefined) {
                this.currentView.onUnload();
            }

            const preInfo = nextView.getInformationFromURL(url);

            const [newTemplate, templatingInfo] = await Promise.all([
                nextView.getTemplate(),
                nextView.getTemplatingInformation(preInfo)
            ]); // fetching of the template and fetching the information needed to fill it are done in parallel


            $("#content").html(newTemplate(templatingInfo)); // TODO animate this ?!
            this.currentView = nextView;

            nextView.onLoaded();

        }
    }

    async changeView(viewName, preInfo) {

        const nextView = this.views[viewName];

        if (this.currentView !== undefined) {
            this.currentView.onUnload();
        }

        const [newTemplate, templatingInfo] = await Promise.all([
            nextView.getTemplate(),
            nextView.getTemplatingInformation(preInfo)
        ]); // fetching of the template and fetching the information needed to fill it are done in parallel


        $("#content").html(newTemplate(templatingInfo)); // TODO animate this ?!
        this.currentView = nextView;

        nextView.onLoaded();

    }

}

/**
 * @abstract
 */
class View {
    constructor(templateLocation) {
        this.templateLocation = templateLocation;
        this.template = undefined;
        this.viewManager = undefined;
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
                    // TODO implement some sort of unified error message for server disconnects
                }
            } catch (e) {
                // TODO implement some sort of unified error message for server disconnects
            }
        } else {
            return this.template;
        }

    }

    /**
     * This method is for testing whether a template can be instantiated from a URL (for example, on page refresh)
     * @param url {String} The url that the information is to be checked
     * @abstract
     */
    isValidURL(url) {
        throw Error("View must implement the abstract method isValidURL");
    }

    /**
     * This method extracts information which could be used to template a page.  This information is either gotten from
     * the URL using this method, or must be passed by another template when it is replacing itself.
     * @abstract
     * @param url {String} The url that the information is to be extracted from
     * @return {Object} Any preliminary information that 'getTemplatingInformation' uses to template the page.
     */
    getInformationFromURL(url) {
        throw Error("View must implement the abstract method getInformationFromURL");
    }

    /**
     * This method allows each view to make a fetch from the server before templating and repainting.  The preliminary
     * information is what makes an instance of the view unique. For example, the home page is always identical and thus
     * takes no preliminary information, whereas the review page is always about a specific review.  This reviews id (or
     * whatever) would be passed as preliminary information.  The preliminary information has two sources: the url of
     * of the page (this is used only when the page is refreshed, such that the state isn't lost),  fed directly by
     * another view when it is being replaced.
     * @abstract
     * @param preliminaryInformation {Object} The instance information for this view
     * @return {Object} The object which is used to by handlebars to template
     */
    getTemplatingInformation(preliminaryInformation) {
        throw Error("View must implement the abstract method getTemplatingInformation");
    }

    /**
     * This method is called after templating. The purpose of this method is to attach listeners and add behaviours to
     * the newly inserted HTML
     * @abstract
     */
    onLoaded() {
        throw Error("View must implement the abstract method onLoaded");
    }

    /**
     * This method is called just before a view is discarded.  The purpose is to allow for saving anything that may be
     * left in forms etc.
     * @abstract
     */
    onUnload() {
        throw Error("View must implement the abstract method onUnload");
    }

}

class ReviewsView extends View {
    constructor() {
        super("templates/myReviews.html");
        this.validURLre = /^\/review\/(?<reviewID>[0-9a-f]{64})$/;
        // match example '/review/651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b'
        // '651878578d5e948845809e5548023b3b01961d5231cfa5b98dd91dedfcf09e9b' captured as reviewID

    }

    isValidURL(url) {
        const result = this.validURLre.exec(url);
        return result !== null && result[0] === url;
    }

    getInformationFromURL(url) {
        return this.validURLre.exec(url).groups;
    }

    getTemplatingInformation(preliminaryInformation) {
    }

    onLoaded() {
    }

    onUnload() {
    }
}

class AboutPageView extends View {
    constructor() {
        super("templates/about.html");
    }

    isValidURL(url) {
        return url === "/about";
    }

    getInformationFromURL(url) {
        return {};
    }

    getTemplatingInformation(preliminaryInformation) {
    }

    onLoaded() {
    }

    onUnload() {
    }
}

class HomeView extends View {
    constructor() {
        super("templates/home.html");
    }

    isValidURL(url) {
        return url === "" || url === "index" || url === "index.html";
    }

    getInformationFromURL(url) {
        return {};
    }

    getTemplatingInformation(preliminaryInformation) {
    }

    onLoaded() {
        $("#test").click(() => {
            console.log("The button ");
            this.viewManager.changeView("reviewList", {});
        });
    }

    onUnload() {
    }
}

class CritiqueView extends View {

    constructor() {
        super("templates/critique.html");
        this.validURLre = /^\/critique\/(?<reviewID>[0-9a-f]{64})$/;
    }

    isValidURL(url) {
        const result = this.validURLre.exec(url);
        return result !== null && result[0] === url;
    }

    getInformationFromURL(url) {
        return this.validURLre.exec(url).groups;
    }

    getTemplatingInformation(preliminaryInformation) {
    }

    onLoaded() {
    }

    onUnload() {
    }
}

const viewManager = new ViewManager({
    "review": new ReviewsView(),
    "critique": new CritiqueView(),
    "about": new AboutPageView(),
    "home": new HomeView()
});

document.addEventListener("DOMContentLoaded", function () {
    viewManager.loadFromURL(window.location.pathname,
        () => viewManager.loadFromURL("index.html")
    );
});