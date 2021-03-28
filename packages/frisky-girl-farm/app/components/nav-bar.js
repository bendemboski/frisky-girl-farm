import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { readOnly, filterBy } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  user: service(),
  order: service(),
  router: service(),

  isLoggedIn: readOnly('user.isLoggedIn'),
  productsOrdered: filterBy('order.products', 'ordered'),

  actions: {
    logout() {
      this.user.logout();
      this.router.transitionTo('login');
    },
  },
});
