import Service, { inject as service } from '@ember/service';
import { alias, bool } from '@ember/object/computed';
import { task } from 'ember-concurrency';
import { ApiError } from './api';

export default Service.extend({
  localSettings: service(),
  api: service(),

  isLoggedIn: bool('email'),

  email: alias('localSettings.settings.userEmail'),
  name: null,
  location: null,
  balance: null,

  //
  // Check if we're logged in (and our login is still valid)
  //
  checkLoggedIn: task(function* () {
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
  }),

  //
  // Log in
  //
  login: task(function* (email) {
    let data = yield this._fetchData.perform(email);
    if (!data) {
      return false;
    }

    this._setData(data);
    this.set('email', email);
    return true;
  }),

  //
  // Log out
  //
  logout() {
    this.setProperties({
      email: null,
      name: null,
      location: null,
      balance: null,
    });
  },

  _fetchData: task(function* (email = this.userEmail) {
    try {
      return yield this.api.getUser(email);
    } catch (e) {
      if (e instanceof ApiError && e.isUnknownUser) {
        return null;
      }
      throw e;
    }
  }),

  _setData({ name, location, balance }) {
    this.setProperties({ name, location, balance });
  },
});
