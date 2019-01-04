import Service, { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { ApiError } from './api';

export default Service.extend({
  api: service(),

  isOrderingOpen: false,
  products: null,

  spent: computed('products.@each.{price,ordered}', function() {
    let products = this.products || [];

    let spent = 0;
    products.forEach(({ price, ordered }) => {
      spent += price * ordered;
    });
    return spent;
  }),

  loadProducts: task(function*() {
    try {
      this.setProperties({
        isOrderingOpen: true,
        products: yield this.api.getProducts()
      });
    } catch (e) {
      if (e instanceof ApiError && e.isOrdersNotOpen) {
        this.setProperties({
          isOrderingOpen: false,
          products: null
        });
      } else {
        throw e;
      }
    }
  }),

  setProductOrder: task(function*(product, quantity) {
    let products = yield this.api.setProductOrder(product.id, quantity);
    this.set('products', products);
  })
});
