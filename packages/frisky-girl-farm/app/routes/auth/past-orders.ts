import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { taskFor } from 'ember-concurrency-ts';

import OrderService from '../../services/order';

export default class AuthIndexRoute extends Route {
  @service declare order: OrderService;

  async model() {
    return await taskFor(this.order.loadPastOrders).perform();
  }
}
