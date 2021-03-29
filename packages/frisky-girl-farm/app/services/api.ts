import Service, { inject as service } from '@ember/service';
import ENV from '../config/environment';
import fetch from 'fetch';

import UserService from './user';
import { User, ProductOrder } from '../types';

const {
  api: { host, namespace },
} = ENV;

interface ProductsResponse {
  products: ProductOrder[];
}

export default class ApiService extends Service {
  @service declare user: UserService;

  async getUser(email: string): Promise<User> {
    return await apiFetch(`/users/${email}`);
  }

  async getProducts() {
    let relUrl = '/products';
    if (this.user.isLoggedIn) {
      relUrl = `${relUrl}?userId=${this.user.email}`;
    }
    let data: ProductsResponse = await apiFetch(relUrl);
    return data.products;
  }

  async setProductOrder(productId: string, quantity: number) {
    let data: ProductsResponse = await apiFetch(
      `/products/${productId}?userId=${this.user.email}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered: quantity }),
      }
    );
    return data.products;
  }
}

export class ApiError extends Error {
  code: string;
  extra: Object;

  constructor(code: string, extra: Object, message?: string) {
    super(message);
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

async function apiFetch(relUrl: string, options?: Object): Promise<any> {
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
