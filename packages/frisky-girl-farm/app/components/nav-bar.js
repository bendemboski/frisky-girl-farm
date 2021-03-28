import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { reads, filterBy } from 'macro-decorators';
import { action } from '@ember/object';

export default class NavBar extends Component {
  @service('user') user;
  @service('order') order;
  @service('router') router;

  @reads('user.isLoggedIn') isLoggedIn;
  @filterBy('order.products', 'ordered') productsOrdered;

  @action
  logout(e) {
    e.preventDefault();
    this.user.logout();
    this.router.transitionTo('login');
  }
}
