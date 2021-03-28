import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { alias, bool } from 'macro-decorators';
import { task } from 'ember-concurrency';
import { ApiError } from './api';

export default class UserService extends Service {
  @service('local-settings') localSettings;
  @service('api') api;

  @bool('email') isLoggedIn;

  @alias('localSettings.settings.userEmail') email;
  @tracked name;
  @tracked location;
  @tracked balance;

  //
  // Check if we're logged in (and our login is still valid)
  //
  @task
  *checkLoggedIn() {
    if (!this.email) {
      return false;
    }

    let data = yield this._fetchData.perform(this.email);
    if (!data) {
      this.logout();
      return false;
    }

    this._setData(data);
    return true;
  }

  //
  // Log in
  //
  @task
  *login(email) {
    let data = yield this._fetchData.perform(email);
    if (!data) {
      return false;
    }

    this._setData(data);
    this.email = email;
    return true;
  }

  //
  // Log out
  //
  logout() {
    this.email = null;
    this.name = null;
    this.location = null;
    this.balance = null;
  }

  @task
  *_fetchData(email = this.userEmail) {
    try {
      return yield this.api.getUser(email);
    } catch (e) {
      if (e instanceof ApiError && e.isUnknownUser) {
        return null;
      }
      throw e;
    }
  }

  _setData({ name, location, balance }) {
    this.name = name;
    this.location = location;
    this.balance = balance;
  }
}
