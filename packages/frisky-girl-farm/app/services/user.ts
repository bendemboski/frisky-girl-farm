import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { alias, bool } from 'macro-decorators';
import { task, TaskGenerator } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { ApiError } from './api';

import ApiService from './api';
import { User } from '../types';

export default class UserService extends Service {
  @service declare localSettings: unknown;
  @service declare api: ApiService;

  @bool('email') declare isLoggedIn: boolean;

  @alias('localSettings.settings.userEmail') declare email: string | null;
  @tracked name: string | null = null;
  @tracked location: string | null = null;
  @tracked balance: number | null = null;

  //
  // Check if we're logged in (and our login is still valid)
  //
  @task
  *checkLoggedIn() {
    if (!this.email) {
      return false;
    }

    let data: User | null = yield taskFor(this._fetchData).perform(this.email);
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
  *login(email: string) {
    let data: User | null = yield taskFor(this._fetchData).perform(email);
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

  private _setData({ name, location, balance }: User) {
    this.name = name;
    this.location = location;
    this.balance = balance;
  }
}
