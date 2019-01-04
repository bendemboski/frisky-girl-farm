import { module, test } from 'qunit';
import { visit, click, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import setupPretender from '../helpers/setup-pretender';
import loginUser from '../helpers/login-user';
import setProducts from '../helpers/set-products';

module('Acceptance | navbar', function(hooks) {
  setupApplicationTest(hooks);
  setupPretender(hooks);

  test('it renders when not logged in', async function(assert) {
    await visit('/');
    assert.dom('[data-test-username]').doesNotExist();
    assert.dom('[data-test-balance]').doesNotExist();
    assert.dom('[data-test-order-trigger]').doesNotExist();
    assert.dom('[data-test-logout]').doesNotExist();
  });

  test('it renders when logged in', async function(assert) {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.00
    });
    await visit('/');

    assert.dom('[data-test-username]').hasText('Ashley Wilson');
    assert.dom('[data-test-balance]').includesText('$85.00');
    assert.dom('[data-test-order-trigger]').exists();
    assert.dom('[data-test-logout]').exists();
  });

  test('order popover works with ordering closed', async function(assert) {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.00
    });
    await visit('/');

    assert.dom('[data-test-order-popover').doesNotExist();
    await click('[data-test-order-trigger]');
    assert.dom('[data-test-order-popover').hasText('Ordering is not open');
  });

  test('order popover works with no orders', async function(assert) {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.00
    });
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.50,
        available: 5,
        ordered: 0
      },
      {
        id: '3',
        name: 'Kale',
        imageUrl: 'http://kale.com/image.jpg',
        price: 5.00,
        available: 0,
        ordered: 0
      },
      {
        id: '4',
        name: 'Spicy Greens',
        imageUrl: 'http://spicy-greens.com/image.jpg',
        price: 13.00,
        available: 10,
        ordered: 0
      }
    ]);
    await visit('/');

    assert.dom('[data-test-order-popover').doesNotExist();
    await click('[data-test-order-trigger]');
    assert.dom('[data-test-order-popover').hasText("You haven't ordered anything yet");
  });

  test('order popover works with orders', async function(assert) {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.00
    });
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.50,
        available: 5,
        ordered: 3
      },
      {
        id: '3',
        name: 'Kale',
        imageUrl: 'http://kale.com/image.jpg',
        price: 5.00,
        available: 0,
        ordered: 0
      },
      {
        id: '4',
        name: 'Spicy Greens',
        imageUrl: 'http://spicy-greens.com/image.jpg',
        price: 13.00,
        available: 10,
        ordered: 6
      }
    ]);
    await visit('/');

    assert.dom('[data-test-order-popover').doesNotExist();
    await click('[data-test-order-trigger]');
    assert.dom('[data-test-order-popover').exists();
    assert.dom('[data-test-order-item]').exists({ count: 2 });

    let [ item1, item2 ] = document.querySelectorAll('[data-test-order-item]');
    assert.dom(item1).includesText('(3)');
    assert.dom(item1).includesText('Lettuce');
    assert.dom(item1).includesText('$10.50');
    assert.dom(item2).includesText('(6)');
    assert.dom(item2).includesText('Spicy Greens');
    assert.dom(item2).includesText('$78.00');
    assert.dom('[data-test-order-total]').includesText('$88.50');
  });

  test('balance display computes correctly', async function(assert) {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.00
    });
    setProducts([
      {
        id: '2',
        name: 'Lettuce',
        imageUrl: 'http://lettuce.com/image.jpg',
        price: 3.50,
        available: 5,
        ordered: 3
      },
      {
        id: '3',
        name: 'Kale',
        imageUrl: 'http://kale.com/image.jpg',
        price: 5.00,
        available: 0,
        ordered: 0
      },
      {
        id: '4',
        name: 'Spicy Greens',
        imageUrl: 'http://spicy-greens.com/image.jpg',
        price: 13.00,
        available: 10,
        ordered: 2
      }
    ]);
    await visit('/');

    assert.dom('[data-test-balance]').includesText('$48.50');
  });

  test('logout works', async function(assert) {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.00
    });
    await visit('/');

    await click('[data-test-logout]');
    assert.equal(currentURL(), '/login');
    assert.notOk(this.owner.lookup('service:local-settings').get('settings.userEmail'));
  });
});
