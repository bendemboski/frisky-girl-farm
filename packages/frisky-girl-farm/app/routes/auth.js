import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class AuthRoute extends Route {
  @service('user') user;

  async redirect() {
    if (!(await this.user.checkLoggedIn.perform())) {
      this.transitionTo('login');
    }
  }
}
