/**
 * A user
 */
export interface User {
  /**
   * The user's email
   */
  email: string;
  /**
   * The user's name
   */
  name: string;
  /**
   * The user's pickup location
   */
  location: string;
  /**
   * The user's remaining balance
   */
  balance: number;
}

/**
 * A past order the user has placed
 */
export interface PastOrder {
  /**
   * A unique id for the order
   */
  id: number;
  /**
   * The date the order sheet was created
   */
  date: Date;
}

/**
 * The API response when fetching a user's list of past orders
 */
export interface PastOrdersResponse {
  orders: Array<Omit<PastOrder, 'date'> & { date: string }>;
}

/**
 * Data about a product in a past order
 */
export interface PastOrderProduct {
  /**
   * The product name
   */
  name: string;
  /**
   * An image URL for the product
   */
  imageUrl: string;
  /**
   * The price of the product
   */
  price: number;
  /**
   * How many units of the product were ordered
   */
  ordered: number;
}

/**
 * The API response when fetching data about a particular past order for a user
 */
export interface PastOrderProductsResponse {
  products: PastOrderProduct[];
}

/**
 * Data about a product in the current order for a user
 */
export interface ProductOrder extends PastOrderProduct {
  /**
   * A unique id for the product
   */
  id: string;
  /**
   * How many units of the product are available to order
   */
  available: number;
}

/**
 * The API response when fetching a user's list of products in the current
 * order, or when setting the user's order for a product
 */
export interface ProductsResponse {
  products: ProductOrder[];
}
