import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { map } from 'macro-decorators';
import { dropTask } from 'ember-concurrency';
import type { PastOrder } from 'frisky-girl-farm/services/order';

class PastOrderState {
  @tracked isOpen = false;

  constructor(public pastOrder: PastOrder) {}

  @dropTask
  async toggle() {
    if (this.isOpen) {
      this.isOpen = false;
    } else {
      await this.pastOrder.load();
      this.isOpen = true;
    }
  }
}

export default class PastOrdersController extends Controller {
  @map('model', (pastOrder) => new PastOrderState(pastOrder))
  declare pastOrderStates: PastOrderState[];
}
