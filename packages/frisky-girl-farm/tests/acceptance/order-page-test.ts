import { module, test } from 'qunit';
import { click, fillIn, blur, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import setupPretender, { getPretenderState } from '../helpers/setup-pretender';
import { setupWindowMock } from 'ember-window-mock/test-support';
import { PageObject, selector } from 'fractal-page-object';
import loginUser from '../helpers/login-user';
import setProducts from '../helpers/set-products';

class OrderPage extends PageObject {
  /**
   * The message that displays when ordering is not open
   */
  orderClosedMessage = selector('[data-test-order-closed]');

  /**
   * The error that displays when the user tries to order more than is
   * available
   */
  availabilityError = selector('[data-test-availability-error]');

  /**
   * The product tiles
   */
  products = selector(
    '[data-test-product-order]',
    class extends PageObject {
      /**
       * The name of the product
       */
      name = selector('[data-test-product-name]');

      /**
       * The button that displays when the product has not been ordered, and
       * that shows the order controls when clicked
       */
      addButton = selector('[data-test-add-button]');

      /**
       * The button to delete the order for the product
       */
      deleteButton = selector('[data-test-delete-button]');

      /**
       * The select input for the quantity
       */
      quantitySelect = selector(
        '[data-test-quantity-select]',
        class extends PageObject {
          options = selector(
            'option',
            class extends PageObject {
              get value() {
                return this.element?.getAttribute('value');
              }
            },
          );
        },
      );

      /**
       * The number input for setting a custom quantity
       */
      quantityInput = selector('[data-test-quantity-input]');

      /**
       * The button for saving the custom quantity in the quantity input
       */
      submitQuantityInputButton = selector('[data-test-submit-quantity-input]');

      /**
       * The total price display
       */
      totalPrice = selector('[data-test-total-price]');
    },
  );
}

const page = new OrderPage();

module('Acceptance | order page', function (hooks) {
  setupApplicationTest(hooks);
  setupPretender(hooks);
  setupWindowMock(hooks);

  hooks.beforeEach(function () {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.0,
    });
  });

  test('it renders the orders closed message when orders are closed', async function (assert) {
    setProducts(null);
    await visit('/');
    assert.dom(page.orderClosedMessage.element).isVisible();
    assert.strictEqual(page.products.length, 0);
  });

  test('it renders products when orders are open', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 5,
        ordered: 0,
      },
      {
        id: '3',
        name: 'Kale',
        imageUrl: 'http://kale.com/image.jpg',
        price: 5.0,
        available: 5,
        ordered: 0,
      },
      {
        id: '4',
        name: 'Spicy Greens',
        imageUrl: 'http://spicy-greens.com/image.jpg',
        price: 13.0,
        available: 10,
        ordered: 0,
      },
    ]);

    await visit('/');
    assert.dom(page.orderClosedMessage.element).isNotVisible();
    assert.strictEqual(page.products.length, 3);
    assert.dom(page.products[0].name.element).hasText('Lettuce');
    assert.dom(page.products[1].name.element).hasText('Kale');
    assert.dom(page.products[2].name.element).hasText('Spicy Greens');
  });

  test('it hides products that are not available to order', async function (assert) {
    setProducts([
      // available
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 5,
        ordered: 0,
      },
      // none available
      {
        id: '3',
        name: 'Kale',
        imageUrl: 'http://kale.com/image.jpg',
        price: 5.0,
        available: 0,
        ordered: 0,
      },
      // user has ordered all that are available
      {
        id: '4',
        name: 'Spicy Greens',
        imageUrl: 'http://spicy-greens.com/image.jpg',
        price: 13.0,
        available: 5,
        ordered: 5,
      },
    ]);

    await visit('/');
    assert.dom(page.orderClosedMessage.element).isNotVisible();
    assert.strictEqual(page.products.length, 2);
    assert.dom(page.products[0].name.element).hasText('Lettuce');
    assert.dom(page.products[1].name.element).hasText('Spicy Greens');
  });

  test('it displays un-ordered products correctly', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 5,
        ordered: 0,
      },
    ]);

    await visit('/');
    assert.dom(page.products[0].name.element).hasText('Lettuce');
    assert.dom(page.products[0].addButton.element).isVisible();
    assert.dom(page.products[0].deleteButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isNotVisible();
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
  });

  test('it displays ordered products correctly', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 10,
        ordered: 5,
      },
    ]);

    await visit('/');
    assert.dom(page.products[0].name.element).hasText('Lettuce');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].deleteButton.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('5');
    assert.deepEqual(
      page.products[0].quantitySelect.options.map((option) => option.value),
      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'custom'],
    );
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
    assert.dom(page.products[0].totalPrice.element).hasText('$17.50');
  });

  test('it displays ordered products with a custom quantity correctly', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 5,
        ordered: 22,
      },
    ]);

    await visit('/');
    assert.dom(page.products[0].name.element).hasText('Lettuce');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].deleteButton.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('22');
    assert.deepEqual(
      page.products[0].quantitySelect.options.map((option) => option.value),
      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '22', 'custom'],
    );
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
    assert.dom(page.products[0].totalPrice.element).hasText('$77.00');
  });

  test('it can order', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 10,
        ordered: 0,
      },
    ]);

    await visit('/');
    await click(page.products[0].addButton.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();

    await fillIn(page.products[0].quantitySelect.element!, '4');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('4');
    assert.dom(page.products[0].totalPrice.element).hasText('$14.00');

    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);
    assert.deepEqual(
      JSON.parse(
        getPretenderState().putProductStub.firstCall.args[0].requestBody,
      ).ordered,
      4,
    );
  });

  test('it can order a custom quantity', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 100,
        ordered: 0,
      },
    ]);

    await visit('/');
    await click(page.products[0].addButton.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();

    await fillIn(page.products[0].quantitySelect.element!, 'custom');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isNotVisible();
    assert.dom(page.products[0].quantityInput.element).isVisible();

    await fillIn(page.products[0].quantityInput.element!, '22');
    await click(page.products[0].submitQuantityInputButton.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('22');
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
    assert.dom(page.products[0].totalPrice.element).hasText('$77.00');

    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);
    assert.deepEqual(
      JSON.parse(
        getPretenderState().putProductStub.firstCall.args[0].requestBody,
      ).ordered,
      22,
    );
  });

  test('blurring the custom quantity input places the order', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 100,
        ordered: 0,
      },
    ]);

    await visit('/');
    await click(page.products[0].addButton.element!);
    await fillIn(page.products[0].quantitySelect.element!, 'custom');
    await fillIn(page.products[0].quantityInput.element!, '22');

    await blur(page.products[0].quantityInput.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('22');
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
    assert.dom(page.products[0].totalPrice.element).hasText('$77.00');

    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);
    assert.deepEqual(
      JSON.parse(
        getPretenderState().putProductStub.firstCall.args[0].requestBody,
      ).ordered,
      22,
    );
  });

  test('it can change the quantity', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 100,
        ordered: 5,
      },
    ]);

    await visit('/');
    await fillIn(page.products[0].quantitySelect.element!, '8');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('8');
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
    assert.dom(page.products[0].totalPrice.element).hasText('$28.00');

    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);
    assert.deepEqual(
      JSON.parse(
        getPretenderState().putProductStub.firstCall.args[0].requestBody,
      ).ordered,
      8,
    );
  });

  test('it can change to a custom quantity', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 100,
        ordered: 5,
      },
    ]);

    await visit('/');
    await fillIn(page.products[0].quantitySelect.element!, 'custom');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isNotVisible();
    assert.dom(page.products[0].quantityInput.element).isVisible();

    await fillIn(page.products[0].quantityInput.element!, '22');
    await click(page.products[0].submitQuantityInputButton.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('22');
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
    assert.dom(page.products[0].totalPrice.element).hasText('$77.00');

    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);
    assert.deepEqual(
      JSON.parse(
        getPretenderState().putProductStub.firstCall.args[0].requestBody,
      ).ordered,
      22,
    );
  });

  test('it can change from a custom quantity', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 100,
        ordered: 22,
      },
    ]);

    await visit('/');
    await fillIn(page.products[0].quantitySelect.element!, '8');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('8');
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
    assert.dom(page.products[0].totalPrice.element).hasText('$28.00');

    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);
    assert.deepEqual(
      JSON.parse(
        getPretenderState().putProductStub.firstCall.args[0].requestBody,
      ).ordered,
      8,
    );
  });

  test('it can change to zero quantity', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 100,
        ordered: 5,
      },
    ]);

    await visit('/');
    await fillIn(page.products[0].quantitySelect.element!, '0');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('0');
    assert.dom(page.products[0].quantityInput.element).isNotVisible();
    assert.dom(page.products[0].totalPrice.element).hasText('$0.00');

    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);
    assert.deepEqual(
      JSON.parse(
        getPretenderState().putProductStub.firstCall.args[0].requestBody,
      ).ordered,
      0,
    );
  });

  test('it can change to zero quantity via the delete button', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 100,
        ordered: 5,
      },
    ]);

    await visit('/');
    await click(page.products[0].deleteButton.element!);
    assert.dom(page.products[0].addButton.element).isVisible();
    assert.dom(page.products[0].deleteButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isNotVisible();
    assert.dom(page.products[0].quantityInput.element).isNotVisible();

    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);
    assert.deepEqual(
      JSON.parse(
        getPretenderState().putProductStub.firstCall.args[0].requestBody,
      ).ordered,
      0,
    );
  });

  test('it can cancel ordering using the delete button', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 100,
        ordered: 0,
      },
    ]);

    await visit('/');
    await click(page.products[0].addButton.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();

    await click(page.products[0].deleteButton.element!);
    assert.dom(page.products[0].addButton.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).isNotVisible();

    // No API calls
    assert.strictEqual(getPretenderState().putProductStub.callCount, 0);
  });

  test('it shows the availability error (detected locally)', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 5,
        ordered: 0,
      },
    ]);

    await visit('/');
    await click(page.products[0].addButton.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('0');
    assert.dom(page.availabilityError.element).isNotVisible();

    await fillIn(page.products[0].quantitySelect.element!, '10');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('0');
    assert.dom(page.availabilityError.element).isVisible();
    assert.dom(page.availabilityError.element).includesText('only 5 of these');

    // No API calls
    assert.strictEqual(getPretenderState().putProductStub.callCount, 0);

    // Clicking clears
    await click(page.products[0].quantitySelect.element!);
    assert.dom(page.availabilityError.element).isNotVisible();
  });

  test('it shows the availability error (API error)', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 20,
        ordered: 0,
      },
    ]);

    await visit('/');
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 0,
        ordered: 0,
      },
    ]);

    await click(page.products[0].addButton.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('0');
    assert.dom(page.availabilityError.element).isNotVisible();

    await fillIn(page.products[0].quantitySelect.element!, '10');
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isVisible();
    assert.dom(page.products[0].quantitySelect.element).hasValue('0');
    assert.dom(page.availabilityError.element).isVisible();
    assert.dom(page.availabilityError.element).includesText('none of these');

    // One API call
    assert.strictEqual(getPretenderState().putProductStub.callCount, 1);

    // Clicking clears
    await click(page.products[0].quantitySelect.element!);
    assert.dom(page.availabilityError.element).isNotVisible();
  });

  test('it shows the availability error with a custom quantity', async function (assert) {
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.5,
        available: 5,
        ordered: 0,
      },
    ]);

    await visit('/');
    await click(page.products[0].addButton.element!);
    await fillIn(page.products[0].quantitySelect.element!, 'custom');
    await fillIn(page.products[0].quantityInput.element!, '22');

    await click(page.products[0].submitQuantityInputButton.element!);
    assert.dom(page.products[0].addButton.element).isNotVisible();
    assert.dom(page.products[0].quantitySelect.element).isNotVisible();
    assert.dom(page.products[0].quantityInput.element).isVisible();
    assert.dom(page.products[0].quantityInput.element).hasValue('22');

    assert.dom(page.availabilityError.element).isVisible();
    assert.dom(page.availabilityError.element).includesText('only 5 of these');

    // No API calls
    assert.strictEqual(getPretenderState().putProductStub.callCount, 0);

    // Clicking clears
    await click(page.products[0].quantityInput.element!);
    assert.dom(page.availabilityError.element).isNotVisible();
  });
});
