import Sheet from './sheet';
import { indexToColumn } from './a1-utils';
import {
  OrdersNotOpenError,
  NegativeQuantityError,
  ProductNotFoundError,
  QuantityNotAvailableError,
} from './errors';
import type { sheets_v4 } from 'googleapis';
import type { ProductOrder } from '../types';

const ordersSheetName = 'Orders';
const namesRowIndex = 0;
const pricesRowIndex = 1;
const imagesRowIndex = 2;
const limitsRowIndex = 3;
const totalsRowIndex = 4;
const firstUserRowIndex = 5;

export type ProductOrderMap = Map<number, Omit<ProductOrder, 'id'>>;

//
// The orders sheet contains a week's products and orders. Row 1, columns B and
// later contain the names of the products. Row 2, columns B and later contain
// the order limits for each product. Row 3, columns B and later contain
// formulas for the total quantity ordered for each product. Rows 4 and later
// contain the user orders, where column A is the user's id, and the other
// columns are the quantites of the products they have ordered (blank means 0).
//
// By default an OrdersSheet points to the sheet for the current week, but it
// can be passed a `sheetName` of a past week orders sheet to access past weeks.
//
export default class OrdersSheet extends Sheet {
  static openOrdersSheetName = ordersSheetName;
  static firstUserRowIndex = firstUserRowIndex;

  constructor(
    client: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetName = ordersSheetName,
  ) {
    super(client, spreadsheetId, sheetName);
  }

  // This is a past orders sheet if the name is anything other than the orders
  // sheet name!
  get isPastOrders() {
    return this.sheetName !== ordersSheetName;
  }

  // Get the order data for a user. Used both to return to the client to render
  // the products, and to load just before modifying a user's order. Returns
  // `{ products, userRowIndex }`. `userRowIndex` is the 0-based index within
  // the user rows of the row containing the user's order, or `-1` if the user
  // does not have an order yet. `products` is a hash whose keys are the
  // 0-based index of the column containing the product (which we use as
  // product ids) and whose values are
  // `{ name, imageUrl, price, available, ordered }`, where:
  // `name` is the name of the product
  // `imageUrl` is the URL of the product image
  // `price` is the price of the product
  // `available` is the number of units of the product available for to order,
  //             ignoring any they have already ordered (i.e. the max they
  //             could set their order to without exceeding availability). If
  //             there is no limit on the product, this will be set to -1.
  // `ordered` is the number of units of the product the user has ordered
  async getForUser(userId: string) {
    let columns;
    try {
      columns = await this.getAll({ majorDimension: 'COLUMNS' });
    } catch (e) {
      if (is400Error(e) && !this.isPastOrders) {
        throw new OrdersNotOpenError();
      } else {
        throw e;
      }
    }

    // Row 0 contains the user ids for the user order rows.
    let userRowIndex = columns[0].slice(firstUserRowIndex).indexOf(userId);
    let products: ProductOrderMap = new Map<number, Omit<ProductOrder, 'id'>>();
    columns.slice(1).forEach((column, i) => {
      let limit = column[limitsRowIndex];
      // has to be non-empty and non-zero for product to appear
      if (limit) {
        // Determine how many this user has ordered
        let ordered;
        if (userRowIndex !== -1) {
          ordered = column[firstUserRowIndex + userRowIndex] || 0;
        } else {
          ordered = 0;
        }

        let available;
        if (limit < 0) {
          available = -1;
        } else {
          // the limit minus the total is the *additional* units the user could
          // order, but we want the *total* units the user could order, so we
          // have to add back what they've already ordered
          available = limit - column[totalsRowIndex] + ordered;
        }

        // id is i + 1 because we're skipping the first column in our iteration
        products.set(i + 1, {
          name: column[namesRowIndex],
          imageUrl: column[imagesRowIndex],
          price: column[pricesRowIndex],
          available,
          ordered,
        });
      }
    });

    return { products, userRowIndex };
  }

  // Set the quantity ordered of a product for a user.
  async setOrdered(userId: string, productId: number, quantity: number) {
    if (quantity < 0) {
      throw new NegativeQuantityError();
    }

    let { products, userRowIndex } = await this.getForUser(userId);
    let product = products.get(productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    let { available } = product;
    if (available !== -1 && quantity > available) {
      throw new QuantityNotAvailableError({ available });
    }

    if (userRowIndex !== -1) {
      // Add 1 to row index because the rows in the A1 notation are 1-based
      await this.update(
        `${indexToColumn(productId)}${firstUserRowIndex + userRowIndex + 1}`,
        [[quantity]],
      );
    } else {
      let row: Array<number | string> = [userId];
      row[productId] = quantity;
      await this.append(`A${firstUserRowIndex + 1}`, row);
    }

    product.ordered = quantity;
    return products;
  }

  // Get an array of user ids (emails) that have ordered a non-zero quantity of
  // any product
  async getUsersWithOrders() {
    let rows;
    try {
      rows = await this.getAll({ majorDimension: 'ROWS' });
    } catch (e) {
      if (is400Error(e) && !this.isPastOrders) {
        throw new OrdersNotOpenError();
      } else {
        throw e;
      }
    }

    let emails = [];
    for (let [email, ...quantities] of rows.slice(firstUserRowIndex)) {
      // Look for any non-zero value
      if (email && quantities.find((cell) => cell)) {
        emails.push(email);
      }
    }
    return emails;
  }
}

function is400Error(e: unknown) {
  return (
    e instanceof Error && 'code' in e && (e as { code: unknown }).code === 400
  );
}
