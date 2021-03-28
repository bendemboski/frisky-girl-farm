import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class AuthIndexRoute extends Route {
  @service('order') order;

  async afterModel() {
    await this.order.loadProducts.perform();
  }
}
