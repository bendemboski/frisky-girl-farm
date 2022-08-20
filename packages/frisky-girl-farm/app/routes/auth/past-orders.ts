import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { taskFor } from 'ember-concurrency-ts';

import type OrderService from '../../services/order';
import type { PastOrder } from '../../services/order';

export default class AuthIndexRoute extends Route<PastOrder[]> {
  @service declare order: OrderService;

  async model() {
    return await taskFor(this.order.loadPastOrders).perform();
  }
}
