import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { helper } from '@ember/component/helper';

class FormState {
  @tracked email;
  @tracked error;
}

export default class LoginController extends Controller {
  @service('user') user;
  @service('router') router;

  createFormState = helper(() => new FormState());

  @task
  *login(formState) {
    formState.error = '';

    if (yield this.user.login.perform(formState.email)) {
      yield this.router.transitionTo('auth.index');
    } else {
      formState.error =
        'We do not recognize that email address. Please ensure you are using the same email that you registered with.';
    }
  }
}
