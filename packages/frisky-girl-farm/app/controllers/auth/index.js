import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default class AuthIndexController extends Controller {
  @service('order') order;
}
