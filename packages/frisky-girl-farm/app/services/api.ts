import Service, { inject as service } from '@ember/service';
import ENV from '../config/environment';
import fetch from 'fetch';

import type UserService from './user';
import type { User, ProductOrder, PastOrderProduct } from '../types';

const {
  api: { host, namespace },
} = ENV;

interface ProductsResponse {
  products: ProductOrder[];
}

interface PastOrdersResponse {
  orders: { id: string; date: string }[];
}

interface PastOrderProductsResponse {
  products: PastOrderProduct[];
}

export interface PastOrder {
  id: string;
  date: Date;
}

export default class ApiService extends Service {
  @service declare user: UserService;

  async getUser(email: string): Promise<User> {
    return await apiFetch<User>(`/users/${email}`);
  }

  async getProducts() {
    let relUrl = '/products';
    if (this.user.isLoggedIn) {
      relUrl = `${relUrl}?${this.authQueryParam}`;
    }
    let data = await apiFetch<ProductsResponse>(relUrl);
    return data.products;
  }

  async setProductOrder(productId: string, quantity: number) {
    let data = await apiFetch<ProductsResponse>(
      `/products/${productId}?${this.authQueryParam}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered: quantity }),
      }
    );
    return data.products;
  }

  async getPastOrders(): Promise<PastOrder[]> {
    let relUrl = `/orders?${this.authQueryParam}`;
    let data = await apiFetch<PastOrdersResponse>(relUrl);
    return data.orders.map(({ id, date }) => ({ id, date: new Date(date) }));
  }

  async getPastOrderProducts(pastOrderId: string) {
    let relUrl = `/orders/${pastOrderId}?${this.authQueryParam}`;
    let data = await apiFetch<PastOrderProductsResponse>(relUrl);
    return data.products;
  }

  get authQueryParam() {
    return `userId=${encodeURIComponent(this.user.email!)}`;
  }
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly extra: Record<string, unknown>,
    message?: string
  ) {
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

async function apiFetch<T>(relUrl: string, options?: RequestInit): Promise<T> {
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
