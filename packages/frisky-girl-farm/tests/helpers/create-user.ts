import { getPretenderState } from './setup-pretender';
import type { User } from 'frisky-girl-farm-api/src/types';

//
// Create a user on the pretender server
//
export default function createUser(user: User) {
  let pretenderState = getPretenderState();
  if (!pretenderState) {
    throw new Error('You must call `setupPretender()` to use this method');
  }
  pretenderState.users[user.email] = user;
}
