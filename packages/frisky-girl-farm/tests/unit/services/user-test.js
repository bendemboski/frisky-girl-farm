import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import setupPretender from '../../helpers/setup-pretender';
import createUser from '../../helpers/create-user';
import loginUser from '../../helpers/login-user';

module('Unit | Service | user', function (hooks) {
  setupTest(hooks);
  setupPretender(hooks);

  let localSettings;
  let service;

  hooks.beforeEach(function () {
    localSettings = this.owner.lookup('service:local-settings');
    service = this.owner.lookup('service:user');
  });

  module('checkLoggedIn', function () {
    test('it works with no stored email', async function (assert) {
      let result = await service.checkLoggedIn.perform();
      assert.notOk(result);
      assert.notOk(service.isLoggedIn);
    });

    test('it works with a valid stored email', async function (assert) {
      loginUser({
        email: 'ashley@friskygirlfarm.com',
        name: 'Ashley Wilson',
        location: 'Wallingford',
        balance: 58.0,
      });

      let result = await service.checkLoggedIn.perform();
      assert.ok(result);
      assert.ok(service.isLoggedIn);
      assert.equal(service.email, 'ashley@friskygirlfarm.com');
      assert.equal(service.name, 'Ashley Wilson');
      assert.equal(service.location, 'Wallingford');
      assert.equal(service.balance, 58.0);
    });

    test('it works with an invalid stored email', async function (assert) {
      localSettings.set('settings.userEmail', 'ashley@friskygirlfarm.com');

      let result = await service.checkLoggedIn.perform();
      assert.notOk(result);
      assert.notOk(service.isLoggedIn);
    });
  });

  module('login', function () {
    test('it works', async function (assert) {
      createUser({
        email: 'ashley@friskygirlfarm.com',
        name: 'Ashley Wilson',
        location: 'Wallingford',
        balance: 58.0,
      });

      let result = await service.login.perform('ashley@friskygirlfarm.com');
      assert.ok(result);
      assert.ok(service.isLoggedIn);
      assert.equal(service.email, 'ashley@friskygirlfarm.com');
      assert.equal(service.name, 'Ashley Wilson');
      assert.equal(service.location, 'Wallingford');
      assert.equal(service.balance, 58.0);
    });

    test('it handles failures', async function (assert) {
      let result = await service.login.perform('ashley@friskygirlfarm.com');
      assert.notOk(result);
      assert.notOk(service.isLoggedIn);
    });
  });

  test('logout works', async function (assert) {
    loginUser({
      email: 'ashley@friskygirlfarm.com',
      name: 'Ashley Wilson',
      location: 'Wallingford',
      balance: 58.0,
    });

    await service.checkLoggedIn.perform();
    assert.ok(service.isLoggedIn);
    service.logout();
    assert.notOk(service.isLoggedIn);
  });
});
