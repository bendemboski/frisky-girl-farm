import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Controller.extend({
  user: service(),
  router: service(),

  setup() {
    this._super(...arguments);
    this.set('formState', {});
  },

  login: task(function*({ email }) {
    this.set('formState.error', '');

    if (yield this.user.login.perform(email)) {
      yield this.router.transitionTo('auth.index');
    } else {
      this.set('formState.error', 'We do not recognize that email address. Please ensure you are using the same email that you registered with.');
    }
  })
});
