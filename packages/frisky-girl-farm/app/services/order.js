import Service, { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { ApiError } from './api';

export default Service.extend({
  api: service(),

  isOrderingOpen: false,
  products: null,

  spent: computed('products.@each.{price,ordered}', function () {
    let products = this.products || [];

    let spent = 0;
    products.forEach(({ price, ordered }) => {
      spent += price * ordered;
    });
    return spent;
  }),

  loadProducts: task(function* () {
    try {
      this.setProperties({
        isOrderingOpen: true,
        products: yield this.api.getProducts(),
      });
    } catch (e) {
      if (e instanceof ApiError && e.isOrdersNotOpen) {
        this.setProperties({
          isOrderingOpen: false,
          products: null,
        });
      } else {
        throw e;
      }
    }
  }),

  // The server doesn't have protections against concurrent API calls. This can
  // be problematic if the same user makes concurrent calls, because it could
  // result in creating two rows for them in the orders sheet. We could probably
  // mitigate this on the server, but just preventing the client from making
  // concurrent order API calls seems like it should be sufficient.
  setProductOrder: task(function* (product, quantity) {
    let products = yield this.api.setProductOrder(product.id, quantity);
    this.set('products', products);
  }).enqueue(),
});
