import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task, enqueueTask } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { ApiError } from './api';

import type ApiService from './api';
import type {
  PastOrderProduct,
  ProductOrder,
} from 'frisky-girl-farm-api/src/types';

export class PastOrder {
  @tracked products: PastOrderProduct[] | null = null;

  constructor(public id: string, public date: Date, private api: ApiService) {}

  get isLoaded() {
    return this.products !== null;
  }

  async load() {
    if (!this.products) {
      let products = await this.api.getPastOrderProducts(this.id);
      this.products = products.filter((product) => product.ordered > 0);
    }
    return this.products;
  }
}

export default class OrderService extends Service {
  @service('api') declare api: ApiService;

  @tracked isOrderingOpen = false;
  @tracked products: ProductOrder[] | null = null;
  @tracked pastOrders: PastOrder[] | null = null;

  get spent() {
    let products = this.products || [];

    let spent = 0;
    products.forEach(({ price, ordered }) => {
      spent += price * ordered;
    });
    return spent;
  }

  @task
  private *_loadProducts() {
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
    return this.products;
  }
  readonly loadProducts = taskFor(this._loadProducts);

  @task
  private *_loadPastOrders() {
    if (!this.pastOrders) {
      let orders: PastOrder[] = yield this.api.getPastOrders();
      this.pastOrders = orders.map(
        ({ id, date }) => new PastOrder(id, date, this.api)
      );
    }
    return this.pastOrders;
  }
  readonly loadPastOrders = taskFor(this._loadPastOrders);

  // The server doesn't have protections against concurrent API calls. This can
  // be problematic if the same user makes concurrent calls, because it could
  // result in creating two rows for them in the orders sheet. We could probably
  // mitigate this on the server, but just preventing the client from making
  // concurrent order API calls seems like it should be sufficient.
  @enqueueTask
  private *_setProductOrder(product: ProductOrder, quantity: number) {
    this.products = yield this.api.setProductOrder(product.id, quantity);
  }
  readonly setProductOrder = taskFor(this._setProductOrder);
}

declare module '@ember/service' {
  interface Registry {
    order: OrderService;
  }
}
