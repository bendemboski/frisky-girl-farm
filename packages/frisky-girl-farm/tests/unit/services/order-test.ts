import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import setupPretender, {
  getPretenderState,
} from '../../helpers/setup-pretender';
import loginUser from '../../helpers/login-user';
import setProducts from '../../helpers/set-products';

import OrderService from 'frisky-girl-farm/services/order';
import { type ProductOrder } from 'frisky-girl-farm-api/src/types';

module('Unit | Service | order', function (hooks) {
  setupTest(hooks);
  setupPretender(hooks);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let localSettings: any;
  let service: OrderService;

  hooks.beforeEach(function () {
    localSettings = this.owner.lookup('service:local-settings');
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.0,
    });

    service = this.owner.lookup('service:order') as OrderService;
  });

  module('loadProducts', function () {
    test('it works when not logged in', async function (assert) {
      localSettings!.set('settings.userEmail', null);
      let products = [
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
          available: 0,
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
        {
          id: '5',
          name: 'Kale Starters',
          imageUrl: 'http://kale-starters.com/image.jpg',
          price: 4.0,
          available: -1,
          ordered: 0,
        },
      ];
      setProducts(products);

      await service.loadProducts.perform();
      assert.ok(service.isOrderingOpen);
      assert.deepEqual(service.products, products);
      assert.notOk(
        getPretenderState().getProductsStub.firstCall.args[0].queryParams
          .userId,
      );
    });

    test('it works when logged in', async function (assert) {
      let products = [
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
          ordered: 5,
        },
        {
          id: '4',
          name: 'Spicy Greens',
          imageUrl: 'http://spicy-greens.com/image.jpg',
          price: 13.0,
          available: 25,
          ordered: 15,
        },
        {
          id: '5',
          name: 'Kale Starters',
          imageUrl: 'http://kale-starters.com/image.jpg',
          price: 4.0,
          available: -1,
          ordered: 0,
        },
      ];
      setProducts(products);

      await service.loadProducts.perform();
      assert.ok(service.isOrderingOpen);
      assert.deepEqual(service.products, products);
      assert.strictEqual(
        getPretenderState().getProductsStub.firstCall.args[0].queryParams
          .userId,
        'ashley@friskygirlfarm.com',
      );
    });

    test('it works when ordering is not open', async function (assert) {
      await service.loadProducts.perform();
      assert.notOk(service.isOrderingOpen);
    });
  });

  module('setProductOrder', function (hooks) {
    let products: ProductOrder[];

    hooks.beforeEach(async function () {
      products = [
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
          ordered: 5,
        },
        {
          id: '4',
          name: 'Spicy Greens',
          imageUrl: 'http://spicy-greens.com/image.jpg',
          price: 13.0,
          available: 25,
          ordered: 15,
        },
        {
          id: '5',
          name: 'Kale Starters',
          imageUrl: 'http://kale-starters.com/image.jpg',
          price: 4.0,
          available: -1,
          ordered: 0,
        },
      ];
      setProducts(products);

      await service.loadProducts.perform();
    });

    test('it works', async function (assert) {
      await service.setProductOrder.perform(service.products![0]!, 3);
      products[0]!.ordered += 3;
      assert.deepEqual(service.products, products);
      assert.strictEqual(
        getPretenderState().putProductStub.firstCall.args[0].queryParams.userId,
        'ashley@friskygirlfarm.com',
      );
    });

    test('it works on products with unlimited quantities', async function (assert) {
      await service.setProductOrder.perform(service.products![3]!, 2);
      products[3]!.ordered += 2;
      assert.deepEqual(service.products, products);
      assert.strictEqual(
        getPretenderState().putProductStub.firstCall.args[0].queryParams.userId,
        'ashley@friskygirlfarm.com',
      );
    });

    test('it errors when the quantity is not available', async function (assert) {
      let error;
      try {
        await service.setProductOrder.perform(service.products![2]!, 50);
      } catch (e) {
        error = e as { code: string; extra: Record<string, unknown> };
      }

      assert.ok(error);
      assert.strictEqual(error!.code, 'quantityNotAvailable');
      assert.deepEqual(error!.extra, { available: 25 });
    });
  });

  test('spent works', async function (assert) {
    let products = [
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
        available: 0,
        ordered: 0,
      },
      {
        id: '4',
        name: 'Spicy Greens',
        imageUrl: 'http://spicy-greens.com/image.jpg',
        price: 13.0,
        available: 30,
        ordered: 0,
      },
      {
        id: '5',
        name: 'Kale Starters',
        imageUrl: 'http://kale-starters.com/image.jpg',
        price: 4.0,
        available: -1,
        ordered: 0,
      },
    ];
    setProducts(products);

    await service.loadProducts.perform();
    assert.strictEqual(service.spent, 0);

    await service.setProductOrder.perform(service.products![0]!, 3);
    assert.strictEqual(service.spent, 10.5);

    await service.setProductOrder.perform(service.products![2]!, 5);
    assert.strictEqual(service.spent, 75.5);

    await service.setProductOrder.perform(service.products![3]!, 2);
    assert.strictEqual(service.spent, 83.5);
  });
});
