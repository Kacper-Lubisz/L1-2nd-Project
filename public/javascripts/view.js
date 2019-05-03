/**
 * This class is the abstraction of pages that the page can displayed.  The content of these pages is replace
 * asynchronously, allowing for a multi page experience from a single page site.
 *
 * Each View has a life cycle of sorts, represented by the onCreate, onPause, onResume and onDestroy methods.  The views
 * are managed by the view manager class which calls these. Views exist in a stack and can be in one of 4 states:
 * NEW; PAUSED; RUNNING and DESTROYED.  These occur respectively: (NEW) before onCreate is called but after the view
 * constructor is called (the view isn't part of the stack yet); (PAUSED) before onResume is called, and after onCreate.
 * This state can also occur if the view is resumed and then paused again.  This means that they view is not on the top
 * of the stack; (RUNNING) This state occurs when the view is being displayed and is on the top of the stack (or
 * otherwise top of stack and not displaying anything) and (DESTROYED) This state occurs after the view has been removed
 * from the top of the stack and onDestroy has been called.
 *
 * @see ViewManager
 * @abstract
 */
class View {
  /**
     * Instantiates a new view
     * @param templateLocation {string} The URL to the template for this view
     */
  constructor(templateLocation) {
    this.templateLocation = templateLocation;
    this.template = undefined;

    this.state = {};

    if (View.pageTemplate === undefined) {
      View.pageTemplate = Handlebars.compile("<div id=\"page{{id}}\" class=\"page collapse\">{{{content}}}</div>");
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
     * See handlebars documentation for more information on how the templating function works
     * @return {Promise<Template>} the templating function
     */
  async getTemplate() {
    if (this.template === undefined) {
      try {

        const response = await View.promiseTimeout(fetch(this.templateLocation));
        if (response.status === 200) {
          this.template = Handlebars.compile(await response.text());
          return this.template;
        } else {
          viewManager.showErrorModal(
            "Failed to load page",
            `Unknown error occurred, status code ${response.status}`,
          );
        }
      } catch (e) {
        viewManager.showErrorModal();
      }
    } else {
      return this.template;
    }

  }

  /**
     * This method is for getting the object that is used for templating.  The return value of this method will be used
     * in combination with the template to create the html that will form the page.
     * @abstract
     */
  async getTemplateContext() {
    return {};
  }

  /**
     * This method simply replaces the html content of the page.
     * @param html {string} The html that is to be rendered as the content of the page
     * @return {Promise<jQuery>} The jQuery selection of the page that was just created
     */
  async pushToContent(html) {

    // TODO add animations to this to make it nice and all

    const page = $("#content");
    page.html(html);
    return page;

  }

  /**
     * This method method is part of the view life cycle.  This method is called when the view is added to the stack,
     * this doesn't necessarily mean that it is on the top of the stack (since it could have been added with another
     * view).  The purpose of this method is to allow for the instantiation which can not be done in the constructor but
     * needs to be done of the view isn't resumed.  For example, making async calls (not possible in a constructor,
     * which can't be async) which are necessary before resume is called.
     * @abstract
     */
  async onCreate() {
  }

  /**
     * This methods is part of the view life cycle. This method is called when the view is moved to the top of the,
     * stack.  The propose of this method is to allow the view to update the html content.  This includes updating the
     * html and adding all the listeners that are needed to make the view function.
     * @abstract
     */
  async onResume() {
  }

  /**
     * This method combines the outputs of getTemplate and getTemplateContext to push result of templating to the
     * content of the page
     * @return {Promise<jQuery>} The jQuery selector of the page
     */
  async templateAndPushPage() {

    const [newTemplate, templatingContext] = await Promise.all([
      this.getTemplate(),
      this.getTemplateContext(),
    ]);// fetch in parallel

    // fetching of the template and fetching the information needed to fill it are done in parallel
    return await this.pushToContent(newTemplate(templatingContext));


  }

  /**
     * This method is part of the view lifecycle and is called when the view leaves the top of the stack.  The purpose
     * of it is to do any unloading.  For example making a request to save some work.
     * @abstract
     */
  async onPause() {

  }

  /**
     * This method is part of the view lifecycle.  It is called when the view is removed from the stack.
     * @abstract
     */
  async onDestroy() {

  }

  /**
     * This method is called on the view on the top of the stack when the user signs in.
     * @abstract
     */
  async onSignIn(userData) {

  }

  /**
     * This method is called on the view on the top of the stack when the user signs out.
     * @abstract
     */
  async onSignOut() {

  }

  /**
     * This method is a wrapper for promises which adds a time out.  The promise passed will either evaluate or will
     * return undefined if the promise takes longer than the time out duration passed.
     *
     * @param promise {Promise<T>} The promise that is to be wrapped
     * @param timeOutDuration The time out duration in milliseconds
     * @return {Promise<T>} The new promise that will evaluate to the same as the passed one or time out
     */
  static promiseTimeout(promise, timeOutDuration = 5000) {
    return new Promise(async function (resolve, reject) {
      setTimeout(function () {
        reject();
      }, timeOutDuration);
      try {
        resolve(await promise);
      } catch (e) {
        reject(e);
      }
    });
  }
}