import Pretender from 'pretender';
import sinon from 'sinon';

//
// Sets up a test module to use a Pretender server
//
export default function setupPretender(hooks) {
  hooks.beforeEach(function() {
    this.pretender = new Pretender();
    this.pretenderState = {
      users: {},
      products: null,
      getUserStub: sinon.stub(),
      getProductsStub: sinon.stub(),
      putProductStub: sinon.stub()
    };

    this.pretender.get(`/users/:email`, this.pretenderState.getUserStub.callsFake(({ params: { email } }) => {
      let user = this.pretenderState.users[email];
      if (user) {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(user)
        ];
      } else {
        return [
          404,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ code: 'unknownUser' })
        ];
      }
    }));

    this.pretender.get('/products', this.pretenderState.getProductsStub.callsFake(() => {
      if (this.pretenderState.products) {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ products: this.pretenderState.products })
        ];
      } else {
        return [
          404,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ code: 'ordersNotOpen' })
        ];
      }
    }));

    this.pretender.put('/products/:id', this.pretenderState.putProductStub.callsFake(({ params: { id: productId }, requestBody }) => {
      if (!this.pretenderState.products) {
        return [
          404,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ code: 'ordersNotOpen' })
        ];
      }

      let product = this.pretenderState.products.find(({ id }) => id === productId);
      if (!product) {
        return [
          404,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ code: 'productNotFound' })
        ];
      }

      let { ordered } = JSON.parse(requestBody);
      if (product.available !== -1 && ordered > product.available) {
        return [
          409,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            code: 'quantityNotAvailable',
            extra: { available: product.available }
          })
        ];
      }

      product.ordered = ordered;
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({ products: this.pretenderState.products })
      ];
    }));
  });

  hooks.afterEach(function() {
    this.pretender.shutdown();
  });
}