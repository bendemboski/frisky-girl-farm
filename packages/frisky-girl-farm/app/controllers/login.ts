import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { helper } from '@ember/component/helper';

import RouterService from '@ember/routing/router-service';
import UserService from '../services/user';

class FormState {
  @tracked email?: string;
  @tracked error?: string;
}

export default class LoginController extends Controller {
  @service('user') declare user: UserService;
  @service('router') declare router: RouterService;

  readonly createFormState = helper(() => new FormState());

  @task
  private *_login(formState: FormState) {
    formState.error = '';

    let didLogIn: boolean = yield this.user.login.perform(formState.email!);
    if (didLogIn) {
      yield this.router.transitionTo('auth.index');
    } else {
      formState.error =
        'We do not recognize that email address. Please ensure you are using the same email that you registered with.';
    }
  }
  readonly login = taskFor(this._login);
}
