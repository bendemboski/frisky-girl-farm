import Component from '@ember/component';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

export default Component.extend({
  tagName: '',

  ordered: computed({
    get() {
      return null;
    },
    set(key, value) {
      this.set('availabilityError', null);
      return parseInt(value, 10) || 0;
    }
  }),

  didReceiveAttrs() {
    this.set('ordered', this.product.ordered);
  },

  submit: task(function*(ordered) {
    this.set('availabilityError', null);

    if (ordered > this.product.available) {
      this.set('availabilityError', { available: this.product.available });
      return;
    }

    try {
      yield this.setOrder(ordered);
    } catch (e) {
      if (e.isQuantityNotAvailable) {
        this.set('availabilityError', { available: e.extra.available });
      } else {
        throw e;
      }
    }
  })
});
