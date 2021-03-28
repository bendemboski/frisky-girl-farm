import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { reads } from 'macro-decorators';

export default class ApplicationController extends Controller {
  @service('user') user;
  @service('router') router;

  @reads('user.isLoggedIn') isLoggedIn;
}
