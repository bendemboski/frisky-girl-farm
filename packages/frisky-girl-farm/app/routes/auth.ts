import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { taskFor } from 'ember-concurrency-ts';

import type UserService from '../services/user';
import type OrderService from '../services/order';

export default class AuthRoute extends Route {
  @service declare user: UserService;
  @service declare order: OrderService;

  async redirect() {
    if (!(await taskFor(this.user.checkLoggedIn).perform())) {
      this.transitionTo('login');
    }
  }

  async afterModel() {
    await taskFor(this.order.loadProducts).perform();
  }
}
