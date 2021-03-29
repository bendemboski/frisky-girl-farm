import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

import OrderService from '../../services/order';

export default class AuthIndexController extends Controller {
  @service declare order: OrderService;
}
