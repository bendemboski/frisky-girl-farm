import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { reads } from 'macro-decorators';

import UserService from '../services/user';
import RouterService from '@ember/routing/router-service';

export default class ApplicationController extends Controller {
  @service declare user: UserService;
  @service('router') declare router: RouterService;

  @reads('user.isLoggedIn') declare isLoggedIn: boolean;
}
