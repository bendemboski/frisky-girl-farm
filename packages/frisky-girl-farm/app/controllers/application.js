import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { readOnly } from '@ember/object/computed';

export default Controller.extend({
  user: service(),
  router: service(),

  isLoggedIn: readOnly('user.isLoggedIn'),

  actions: {
    logout() {
      this.user.logout();
      this.router.transitionTo('login');
    },
  },
});
