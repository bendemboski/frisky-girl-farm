import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { filterBy } from '@ember/object/computed';

export default Controller.extend({
  order: service(),

  productsOrdered: filterBy('order.products', 'ordered'),
});
