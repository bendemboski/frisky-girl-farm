import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
// @ts-expect-error no types
import { localCopy } from 'tracked-toolbox';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';

import type { ProductOrder } from 'frisky-girl-farm-api/src/types';

interface AvailabilityError {
  available: number;
}

interface ProductOrderArguments {
  product: ProductOrder;
  setOrder: (count: number) => Promise<void>;
}

export default class ProductOrderComponent extends Component<ProductOrderArguments> {
  get product() {
    return this.args.product;
  }
  get setOrder() {
    return this.args.setOrder;
  }

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
  private *_submit(ordered: number) {
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
  readonly submit = taskFor(this._submit);
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ProductOrder: typeof ProductOrderComponent;
  }
}
