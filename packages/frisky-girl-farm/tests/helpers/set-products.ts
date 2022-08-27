import { getPretenderState } from './setup-pretender';

import type { ProductOrder } from 'frisky-girl-farm-api/src/types';

//
// Set the product list on the pretender server
//
export default function setProducts(products: ProductOrder[]) {
  let pretenderState = getPretenderState();
  if (!pretenderState) {
    throw new Error('You must call `setupPretender()` to use this method');
  }
  pretenderState.products = JSON.parse(JSON.stringify(products));
}
