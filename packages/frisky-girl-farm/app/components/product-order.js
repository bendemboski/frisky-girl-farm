import Component from '@glimmer/component';
import { reads } from 'macro-decorators';
import { tracked } from '@glimmer/tracking';
import { localCopy } from 'tracked-toolbox';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';

export default class ProductOrder extends Component {
  @reads('args.product') product;

  @localCopy('product.ordered') ordered;
  @tracked availabilityError;

  @action
  setOrdered(e) {
    this.availabilityError = null;
    this.ordered = parseInt(e.target.value, 10) || 0;
  }

  @action
  resetOrdered() {
    this.ordered = this.product.ordered;
  }

  @task
  *submit(ordered) {
    this.availabilityError = null;

    if (this.product.available !== -1 && ordered > this.product.available) {
      this.availabilityError = { available: this.product.available };
      return;
    }

    try {
      yield this.setOrder(ordered);
    } catch (e) {
      if (e.isQuantityNotAvailable) {
        this.availabilityError = { available: e.extra.available };
      } else {
        throw e;
      }
    }
  }
}
