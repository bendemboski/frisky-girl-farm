import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task, enqueueTask } from 'ember-concurrency';
import { ApiError } from './api';

import ApiService from './api';
import { ProductOrder } from '../types';

export default class OrderService extends Service {
  @service declare api: ApiService;

  @tracked isOrderingOpen = false;
  @tracked products: ProductOrder[] | null = null;

  get spent() {
    let products = this.products || [];

    let spent = 0;
    products.forEach(({ price, ordered }) => {
      spent += price * ordered;
    });
    return spent;
  }

  @task
  async loadProducts() {
    try {
      this.isOrderingOpen = true;
      this.products = await this.api.getProducts();
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
  @enqueueTask
  async setProductOrder(product: ProductOrder, quantity: number) {
    this.products = await this.api.setProductOrder(product.id, quantity);
  }
}
