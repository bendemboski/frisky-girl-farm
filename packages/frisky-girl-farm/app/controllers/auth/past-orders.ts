import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { dropTask } from 'ember-concurrency';
import type { PastOrder } from 'frisky-girl-farm/services/order';

class PastOrderState {
  @tracked isOpen = false;

  constructor(readonly pastOrder: PastOrder) {}

  readonly toggle = dropTask(async () => {
    if (this.isOpen) {
      this.isOpen = false;
    } else {
      await this.pastOrder.load();
      this.isOpen = true;
    }
  });
}

export default class PastOrdersController extends Controller {
  declare model: PastOrder[];

  get pastOrderStates() {
    return this.model.map((pastOrder) => new PastOrderState(pastOrder));
  }
}
