import { getContext } from '@ember/test-helpers';

//
// Create a user on the pretender server
//
export default function createUser({ email, name, location, balance }) {
  let { pretenderState } = getContext();
  if (!pretenderState) {
    throw new Error('You must call `setupPretender()` to use this method');
  }
  pretenderState.users[email] = { email, name, location, balance };
}
