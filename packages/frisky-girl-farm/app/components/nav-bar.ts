import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { reads, filterBy } from 'macro-decorators';
import { action } from '@ember/object';
import window from 'ember-window-mock';

import RouterService from '@ember/routing/router-service';
import UserService from '../services/user';
import OrderService from '../services/user';
import { ProductOrder } from '../types';

export default class NavBar extends Component {
  @service declare user: UserService;
  @service declare order: OrderService;
  @service('router') declare router: RouterService;

  @reads('user.isLoggedIn') declare isLoggedIn: boolean;

  @filterBy('order.products', 'ordered')
  declare productsOrdered: ProductOrder[];

  @action
  logout(e: Event) {
    e.preventDefault();
    this.user.logout();
    window.location.href = this.router.urlFor('login');
  }
}
