import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import window from 'ember-window-mock';

import RouterService from '@ember/routing/router-service';
import UserService from '../services/user';
import OrderService from '../services/order';

export default class NavBar extends Component {
  @service('user') declare user: UserService;
  @service('order') declare order: OrderService;
  @service('router') declare router: RouterService;

  @tracked orderPopoverShown = false;

  get isLoggedIn() {
    return this.user.isLoggedIn;
  }

  get productsOrdered() {
    return this.order.products?.filter((p) => p.ordered) || [];
  }

  @action
  logout(e: Event) {
    e.preventDefault();
    this.user.logout();
    window.location.href = this.router.urlFor('login');
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    NavBar: typeof NavBar;
  }
}
