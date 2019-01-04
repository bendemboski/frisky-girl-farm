import { getContext } from '@ember/test-helpers';

//
// Set the product list on the pretender server
//
export default function setProducts(products) {
  let { pretenderState } = getContext();
  if (!pretenderState) {
    throw new Error('You must call `setupPretender()` to use this method');
  }
  pretenderState.products = JSON.parse(JSON.stringify(products));
}
