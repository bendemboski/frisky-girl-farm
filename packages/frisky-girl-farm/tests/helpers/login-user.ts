import { getContext } from '@ember/test-helpers';
import createUser from './create-user';

import type { User } from 'frisky-girl-farm-api/src/types';
import type { TestContext } from '@ember/test-helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LocalSettings = any;

//
// Create a user on the pretender server and log them in
//
export default function loginUser(user: User) {
  createUser(user);
  (
    (getContext() as TestContext).owner.lookup(
      'service:local-settings',
    ) as LocalSettings
  ).set('settings.userEmail', user.email);
}
