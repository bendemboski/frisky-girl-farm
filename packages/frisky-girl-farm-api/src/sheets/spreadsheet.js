const LocationsSheet = require('./locations-sheet');
const UsersSheet = require('./users-sheet');
const OrdersSheet = require('./orders-sheet');
const log = require('../log');

class Spreadsheet {
  constructor({ id, client }) {
    this.id = id;
    this.client = client;
    this.locations = new LocationsSheet({ client, spreadsheetId: id });
    this.users = new UsersSheet({ client, spreadsheetId: id });
    this.orders = new OrdersSheet({ client, spreadsheetId: id });
  }

  async getLocations() {
    return await this.locations.getLocations();
  }

  async getUsers(userIds) {
    return await this.users.getUsers(userIds);
  }

  async getUser(userId) {
    return await this.users.getUser(userId);
  }

  async getProducts(userId) {
    let { products } = await this.orders.getForUser(userId);
    return products;
  }

  async setProductOrder(userId, productId, quantity) {
    try {
      log('setting order');
      return await this.orders.setOrdered(userId, productId, quantity);
    } catch (e) {
      log('failed to set order', e);
      throw e;
    }
  }

  getOrdersSheet(sheetName) {
    return new OrdersSheet({
      client: this.client,
      spreadsheetId: this.id,
      sheetName,
    });
  }
}

module.exports = Spreadsheet;
