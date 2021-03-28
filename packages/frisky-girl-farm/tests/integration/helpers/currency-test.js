import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | currency', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    this.set('amount', 0);

    await render(hbs`{{currency this.amount}}`);
    assert.dom(this.element).hasText('$0.00');

    this.set('amount', 3.5);
    assert.dom(this.element).hasText('$3.50');

    this.set('amount', -8);
    assert.dom(this.element).hasText('-$8.00');
  });
});
