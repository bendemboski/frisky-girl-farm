import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';
import type UserService from '../services/user';
import type OrderService from '../services/order';

export default class AuthRoute extends Route {
  @service('router') declare router: RouterService;
  @service('user') declare user: UserService;
  @service('order') declare order: OrderService;

  async redirect() {
    if (!(await this.user.checkLoggedIn.perform())) {
      this.router.transitionTo('login');
    }
  }

  async afterModel() {
    await this.order.loadProducts.perform();
  }
}
