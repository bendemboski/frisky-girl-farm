import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { waitFor } from '@ember/test-waiters';
import { modifier } from 'ember-modifier';

import type { ProductOrder } from 'frisky-girl-farm-api/src/types';
import { ApiError } from 'frisky-girl-farm/services/api';

interface AvailabilityError {
  available: number;
}

interface ProductOrderArguments {
  product: ProductOrder;
  setOrder: (count: number) => Promise<void>;
}

type ControlsDisplayMode = 'hidden' | 'select' | 'input';

const maxSelectQuantity = 10;
const customSelectValue = 'custom';

export default class ProductOrderComponent extends Component<ProductOrderArguments> {
  /**
   * The display mode of the controls
   */
  @tracked controlsDisplayMode: ControlsDisplayMode =
    this.args.product.ordered > 0 ? 'select' : 'hidden';

  /**
   * Force the controls to be shown (called when the user clicks the add
   * button)
   */
  @action
  showControls() {
    this.controlsDisplayMode = 'select';
  }

  /**
   * The values to show in the select input
   */
  get selectValues() {
    // Base numeric values
    let values: Array<{ value: number | string; label: string }> = Array.from(
      Array(maxSelectQuantity + 1).keys(),
    ).map((value) => ({ value, label: `${value}` }));

    // If the ordered value is custom, show it as an option so it can be
    // the current value of the selected input
    if (this.args.product.ordered > maxSelectQuantity) {
      values.push({
        value: this.args.product.ordered,
        label: `${this.args.product.ordered} `,
      });
    }

    // Add the custom option
    values.push({ value: customSelectValue, label: 'More' });
    return values;
  }

  /**
   * The value of the custom input (when shown)
   */
  @tracked customInputValue = this.args.product.ordered;

  /**
   * When the user chooses an option for the select input
   */
  @action
  async onSelectOrdered(e: InputEvent) {
    let select = e.target as HTMLSelectElement;
    let value = select.value;
    if (value === customSelectValue) {
      // It's the custom value, so show the custom input and initialize it with
      // the current ordered value
      this.controlsDisplayMode = 'input';
      this.customInputValue = this.args.product.ordered;
    } else {
      // It's a numeric value, so submit it
      if (!(await this.setOrdered.perform(parseInt(value, 10) || 0))) {
        // Failed, so reset the select value
        select.value = `${this.args.product.ordered}`;
      }
    }
  }

  /**
   * When the user types into the custom order quantity input
   */
  @action
  onInputCustomOrdered(e: InputEvent) {
    let value = (e.target as HTMLInputElement).value;
    this.customInputValue = parseInt(value, 10) || 0;
  }

  /**
   * When the user chooses to save the custom order quantity in the input
   */
  @action
  saveCustomOrder() {
    if (this.customInputValue === this.args.product.ordered) {
      return;
    }

    this.setOrdered.perform(this.customInputValue);
  }

  @action
  async resetOrder() {
    if (this.args.product.ordered !== 0) {
      await this.setOrdered.perform(0);
    }
    this.controlsDisplayMode = 'hidden';
  }

  readonly autofocus = modifier((element: HTMLElement) => element.focus());

  /**
   * If the user tries to order more than is available, this describes the error
   * condition
   */
  @tracked availabilityError: AvailabilityError | null = null;

  @task
  @waitFor
  private *_setOrdered(ordered: number) {
    this.availabilityError = null;

    if (
      this.args.product.available !== -1 &&
      ordered > this.args.product.available
    ) {
      this.availabilityError = { available: this.args.product.available };
      return false;
    }

    try {
      yield this.args.setOrder(ordered);
      this.controlsDisplayMode = 'select';
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.isQuantityNotAvailable) {
        this.availabilityError = { available: e.extra['available'] as number };
        return false;
      } else {
        throw e;
      }
    }
  }
  /**
   * Set the ordered quantity
   */
  readonly setOrdered = taskFor(this._setOrdered);
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ProductOrder: typeof ProductOrderComponent;
  }
}
