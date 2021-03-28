import { module, test } from 'qunit';
import { visit, currentURL, fillIn, click } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import setupPretender from '../helpers/setup-pretender';
import loginUser from '../helpers/login-user';
import createUser from '../helpers/create-user';

module('Acceptance | login', function(hooks) {
  setupApplicationTest(hooks);
  setupPretender(hooks);

  test('it is shown when not logged in', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/login');
  });

  test('it is not shown when logged in', async function(assert) {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.00
    });
    await visit('/');
    assert.equal(currentURL(), '/');
  });

  test('it can log in', async function(assert) {
    createUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 85.00
    });
    await visit('/');

    await fillIn('input[type="email"]', 'ashley@friskygirlfarm.com');
    await click('[type="submit"]');

    assert.equal(currentURL(), '/');
    assert.equal(this.owner.lookup('service:local-settings').get('settings.userEmail'), 'ashley@friskygirlfarm.com');
  });

  test('it handles login failures', async function(assert) {
    await visit('/');

    await fillIn('input[type="email"]', 'ashley@friskygirlfarm.com');
    await click('[type="submit"]');

    assert.equal(currentURL(), '/login');
    assert.dom('.invalid-feedback').includesText('We do not recognize that email address');
  });
});
