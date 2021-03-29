import Component from '@glimmer/component';
import { reads } from 'macro-decorators';
import { tracked } from '@glimmer/tracking';
// @ts-expect-error
import { localCopy } from 'tracked-toolbox';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';

import { ProductOrder } from '../types';

interface AvailabilityError {
  available: number;
}

export default class ProductOrderComponent extends Component {
  @reads('args.product') declare product: ProductOrder;
  @reads('args.setOrder') declare setOrder: (count: number) => Promise<void>;

  @localCopy('product.ordered') declare ordered: number;
  @tracked availabilityError: AvailabilityError | null = null;

  @action
  setOrdered(e: InputEvent) {
    this.availabilityError = null;
    this.ordered = parseInt((e.target as HTMLInputElement).value, 10) || 0;
  }

  @action
  resetOrdered() {
    this.ordered = this.product.ordered;
  }

  @task
  async submit(ordered: number) {
    this.availabilityError = null;

    if (this.product.available !== -1 && ordered > this.product.available) {
      this.availabilityError = { available: this.product.available };
      return;
    }

    try {
      await this.setOrder(ordered);
    } catch (e) {
      if (e.isQuantityNotAvailable) {
        this.availabilityError = { available: e.extra.available };
      } else {
        throw e;
      }
    }
  }
}
