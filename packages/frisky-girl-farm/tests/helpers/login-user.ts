import { getContext } from '@ember/test-helpers';
import createUser from './create-user';

import { User } from 'frisky-girl-farm/types';
import { TestContext } from 'ember-test-helpers';

//
// Create a user on the pretender server and log them in
//
export default function loginUser(user: User) {
  createUser(user);
  (getContext() as TestContext).owner
    .lookup('service:local-settings')
    .set('settings.userEmail', user.email);
}
