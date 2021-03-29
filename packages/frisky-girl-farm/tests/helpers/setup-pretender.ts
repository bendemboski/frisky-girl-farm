import Pretender from 'pretender';
import sinon from 'sinon';
import { getContext } from '@ember/test-helpers';

import { User, ProductOrder } from 'frisky-girl-farm/types';

export class PretenderState {
  users: Record<string, User> = {};
  products: ProductOrder[] | null = null;
  getUserStub = sinon.stub();
  getProductsStub = sinon.stub();
  putProductStub = sinon.stub();
}

class TestState {
  pretender = new Pretender();
  pretenderState = new PretenderState();
}

const state: WeakMap<Object, TestState> = new WeakMap();

function getPretender(): Pretender {
  return state.get(getContext())!.pretender;
}

export function getPretenderState(): PretenderState {
  return state.get(getContext())!.pretenderState;
}

//
// Sets up a test module to use a Pretender server
//
export default function setupPretender(hooks: NestedHooks) {
  hooks.beforeEach(function () {
    state.set(getContext(), new TestState());

    let pretender = getPretender();
    let pretenderState = getPretenderState();
    pretender.get(
      `/users/:email`,
      pretenderState.getUserStub.callsFake(({ params: { email } }) => {
        let user = pretenderState.users[email];
        if (user) {
          return [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(user),
          ];
        } else {
          return [
            404,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ code: 'unknownUser' }),
          ];
        }
      })
    );

    pretender.get(
      '/products',
      pretenderState.getProductsStub.callsFake(() => {
        if (pretenderState.products) {
          return [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ products: pretenderState.products }),
          ];
        } else {
          return [
            404,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ code: 'ordersNotOpen' }),
          ];
        }
      })
    );

    pretender.put(
      '/products/:id',
      pretenderState.putProductStub.callsFake(
        ({ params: { id: productId }, requestBody }) => {
          if (!pretenderState.products) {
            return [
              404,
              { 'Content-Type': 'application/json' },
              JSON.stringify({ code: 'ordersNotOpen' }),
            ];
          }

          let product = pretenderState.products.find(
            ({ id }) => id === productId
          );
          if (!product) {
            return [
              404,
              { 'Content-Type': 'application/json' },
              JSON.stringify({ code: 'productNotFound' }),
            ];
          }

          let { ordered } = JSON.parse(requestBody);
          if (product.available !== -1 && ordered > product.available) {
            return [
              409,
              { 'Content-Type': 'application/json' },
              JSON.stringify({
                code: 'quantityNotAvailable',
                extra: { available: product.available },
              }),
            ];
          }

          product.ordered = ordered;
          return [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ products: pretenderState.products }),
          ];
        }
      )
    );
  });

  hooks.afterEach(function () {
    getPretender().shutdown();
  });
}
