import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

import UserService from '../services/user';
import RouterService from '@ember/routing/router-service';

export default class ApplicationController extends Controller {
  @service('user') declare user: UserService;
  @service('router') declare router: RouterService;

  get isLoggedIn() {
    return this.user.isLoggedIn;
  }
}
