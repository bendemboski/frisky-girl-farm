import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { ApiError } from './api';

export default class OrderService extends Service {
  @service('api') api;

  @tracked isOrderingOpen = false;
  @tracked products = null;

  get spent() {
    let products = this.products || [];

    let spent = 0;
    products.forEach(({ price, ordered }) => {
      spent += price * ordered;
    });
    return spent;
  }

  @task
  *loadProducts() {
    try {
      this.isOrderingOpen = true;
      this.products = yield this.api.getProducts();
    } catch (e) {
      if (e instanceof ApiError && e.isOrdersNotOpen) {
        this.isOrderingOpen = false;
        this.products = null;
      } else {
        throw e;
      }
    }
  }

  // The server doesn't have protections against concurrent API calls. This can
  // be problematic if the same user makes concurrent calls, because it could
  // result in creating two rows for them in the orders sheet. We could probably
  // mitigate this on the server, but just preventing the client from making
  // concurrent order API calls seems like it should be sufficient.
  @task({ enqueue: true })
  *setProductOrder(product, quantity) {
    this.products = yield this.api.setProductOrder(product.id, quantity);
  }
}
