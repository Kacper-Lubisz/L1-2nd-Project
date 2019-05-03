/**
 * This view is for the about page.
 */
class AboutView extends View {

  constructor() {
    super("/templates/about.mustache");
  }

  /**
     * @inheritDoc
     */
  async getTemplateContext() {
    return {};
  }

  /**
     * @inheritDoc
     */
  async onCreate() {
    history.replaceState({
      about: {},
    }, "DurPeer About", "/about");
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

    this.page.find("[data-toggle=\"tooltip\"]").tooltip();

  }

  /**
     * @inheritDoc
     */
  async onSignIn(userData) {
    await viewManager.popAllPush(new HomeView(userData));
  }

  /**
     * @inheritDoc
     */
  async onSignOut() {
    // This should never happen, should always be signed out
  }
}