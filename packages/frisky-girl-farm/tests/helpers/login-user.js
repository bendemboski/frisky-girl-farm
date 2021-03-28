import { getContext } from '@ember/test-helpers';
import createUser from './create-user';

//
// Create a user on the pretender server and log them in
//
export default function loginUser(props) {
  createUser(props);
  let { email } = props;
  getContext()
    .owner.lookup('service:local-settings')
    .set('settings.userEmail', email);
}
