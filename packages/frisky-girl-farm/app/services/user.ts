import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { alias } from 'macro-decorators';
import { task, type TaskGenerator } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { ApiError } from './api';

import ApiService from './api';
import { type User } from 'frisky-girl-farm-api/src/types';

export default class UserService extends Service {
  @service('local-settings') declare localSettings: unknown;
  @service('api') declare api: ApiService;

  get isLoggedIn() {
    return Boolean(this.email);
  }

  @alias('localSettings.settings.userEmail') declare email: string | null;
  @tracked name: string | null = null;
  @tracked location: string | null = null;
  @tracked balance: number | null = null;

  //
  // Check if we're logged in (and our login is still valid)
  //
  @task
  private *_checkLoggedIn() {
    if (!this.email) {
      return false;
    }

    let data: User | null = yield this.fetchData.perform(this.email);
    if (!data) {
      this.logout();
      return false;
    }

    this._setData(data);
    return true;
  }
  readonly checkLoggedIn = taskFor(this._checkLoggedIn);

  //
  // Log in
  //
  @task
  private *_login(email: string) {
    let data: User | null = yield this.fetchData.perform(email);
    if (!data) {
      return false;
    }

    this._setData(data);
    this.email = email;
    return true;
  }
  readonly login = taskFor(this._login);

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
  private *_fetchData(email: string): TaskGenerator<User | null> {
    try {
      return yield this.api.getUser(email);
    } catch (e) {
      if (e instanceof ApiError && e.isUnknownUser) {
        return null;
      }
      throw e;
    }
  }
  readonly fetchData = taskFor(this._fetchData);

  private _setData({ name, location, balance }: User) {
    this.name = name;
    this.location = location;
    this.balance = balance;
  }
}

declare module '@ember/service' {
  interface Registry {
    user: UserService;
  }
}
