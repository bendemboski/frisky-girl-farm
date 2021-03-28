import Service, { inject as service } from '@ember/service';
import ENV from '../config/environment';
import fetch from 'fetch';

const {
  api: { host, namespace },
} = ENV;

export default Service.extend({
  user: service(),

  async getUser(email) {
    return await apiFetch(`/users/${email}`);
  },

  async getProducts() {
    let relUrl = '/products';
    if (this.user.isLoggedIn) {
      relUrl = `${relUrl}?userId=${this.user.email}`;
    }
    let { products } = await apiFetch(relUrl);
    return products;
  },

  async setProductOrder(productId, quantity) {
    let { products } = await apiFetch(
      `/products/${productId}?userId=${this.user.email}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered: quantity }),
      }
    );
    return products;
  },
});

export class ApiError extends Error {
  constructor(code, extra, ...args) {
    super(...args);
    this.code = code;
    this.extra = extra;
    Error.captureStackTrace(this, ApiError);
  }

  get isOrdersNotOpen() {
    return this.code === 'ordersNotOpen';
  }

  get isNegativeQuantity() {
    return this.code === 'negativeQuantity';
  }

  get isProductNotFound() {
    return this.code === 'productNotFound';
  }

  get isQuantityNotAvailable() {
    return this.code === 'quantityNotAvailable';
  }

  get isUnknownUser() {
    return this.code === 'unknownUser';
  }
}

async function apiFetch(relUrl, options) {
  let url;
  if (host) {
    url = `${host}`;
  } else {
    let a = document.createElement('a');
    a.href = '/';
    url = a.href.slice(0, -1); // remove trailing slash
  }

  if (namespace) {
    url = `${url}/${namespace}`;
  }
  url = `${url}${relUrl}`;

  let response = await fetch(url, options);
  if (response.ok) {
    return await response.json();
  }
  let toThrow;
  try {
    let { code, extra } = await response.json();
    toThrow = new ApiError(code, extra);
  } catch (e) {
    toThrow = new Error(`Error logging in: ${response.status}`);
  }

  throw toThrow;
}
