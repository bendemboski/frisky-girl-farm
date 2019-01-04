import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  ordered: computed({
    get() {
      return null;
    },
    set(key, value) {
      return parseInt(value, 10) || 0;
    }
  }),

  didReceiveAttrs() {
    this.setProperties({
      baseOrdered: this.product.ordered,
      ordered: this.product.ordered
    });
  }
});
