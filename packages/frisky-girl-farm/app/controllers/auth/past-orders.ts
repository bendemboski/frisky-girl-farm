import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { dropTask } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import type { PastOrder } from 'frisky-girl-farm/services/order';

class PastOrderState {
  @tracked isOpen = false;

  constructor(readonly pastOrder: PastOrder) {}

  @dropTask
  private *_toggle() {
    if (this.isOpen) {
      this.isOpen = false;
    } else {
      yield this.pastOrder.load();
      this.isOpen = true;
    }
  }
  readonly toggle = taskFor(this._toggle);
}

export default class PastOrdersController extends Controller {
  declare model: PastOrder[];

  get pastOrderStates() {
    return this.model.map((pastOrder) => new PastOrderState(pastOrder));
  }
}
