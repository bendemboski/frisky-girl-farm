import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { taskFor } from 'ember-concurrency-ts';

import UserService from '../services/user';

export default class AuthRoute extends Route {
  @service declare user: UserService;

  async redirect() {
    if (!(await taskFor(this.user.checkLoggedIn).perform())) {
      this.transitionTo('login');
    }
  }
}
