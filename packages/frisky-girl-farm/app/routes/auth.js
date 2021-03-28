import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  user: service(),

  async redirect() {
    if (!(await this.user.checkLoggedIn.perform())) {
      this.transitionTo('login');
    }
  },
});
