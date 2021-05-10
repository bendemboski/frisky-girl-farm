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

  /**
   * Get a list of all of the (past) orders for a given user
   *
   * @param {string} userId the id/email of the user
   *
   * @returns {Array<{id: string, date: Date}>}
   */
  async getUserOrders(userId) {
    const orderSheetKey = 'orderSheet';

    // Get all order sheets by filtering by developer metadata
    let {
      data: { sheets },
    } = await this.client.spreadsheets.getByDataFilter({
      spreadsheetId: this.id,
      resource: {
        dataFilters: [
          {
            developerMetadataLookup: {
              metadataLocation: {
                locationType: 'SHEET',
              },
              metadataKey: orderSheetKey,
            },
          },
        ],
      },
      fields: [
        'sheets.properties.sheetId',
        'sheets.properties.title',
        'sheets.developerMetadata.metadataKey',
        'sheets.developerMetadata.metadataValue',
      ].join(','),
    });

    let sheetDates = {};
    for (let sheet of sheets) {
      if (sheet.properties.title === OrdersSheet.openOrdersSheetName) {
        // Ignore the current/open orders sheet
        continue;
      }

      // If the metadata lookup doesn't match any sheets, the API will return all
      // sheets (!), so even though we always expect there to be developerMetadata,
      // let's be defensive.
      let developerMetadata = sheet.developerMetadata || [];
      let metadata = developerMetadata.find(
        (meta) => meta.metadataKey === orderSheetKey
      );
      if (metadata) {
        sheetDates[sheet.properties.sheetId] = new Date(metadata.metadataValue);
      }
    }

    if (Object.keys(sheetDates).length === 0) {
      return [];
    }

    // Now do a batch get of the first columns of all the order sheets so we can
    // look to see which ones include the current user
    let {
      data: { valueRanges },
    } = await this.client.spreadsheets.values.batchGetByDataFilter({
      spreadsheetId: this.id,
      resource: {
        dataFilters: Object.keys(sheetDates).map((sheetId) => {
          return {
            gridRange: {
              sheetId,
              startColumnIndex: 0,
              endColumnIndex: 1,
              startRowIndex: OrdersSheet.firstUserRowIndex,
            },
          };
        }),
        majorDimension: 'COLUMNS',
      },
    });

    // Now assemble the data into order objects
    let orders = [];
    for (let { valueRange, dataFilters } of valueRanges) {
      // If we didn't match any values (which should never happen, but let's be
      // defensive), then instead of `valueRange.values` being an empty array,
      // it will just be missing.
      let values = valueRange.values || [];
      let column = values[0] || [];

      // values is an array of columns, although we only requested one, so
      // values[0] is the actual column of users that placed an order
      if (!column.includes(userId)) {
        continue;
      }

      // Get the sheet id back out of the data filters the response echoes back
      let sheetId = dataFilters[0].gridRange.sheetId;
      // Create an order object!
      orders.push({
        id: sheetId,
        date: sheetDates[sheetId],
      });
    }
    return orders;
  }

  async getOrdersSheet(sheetId) {
    let {
      data: { sheets },
    } = await this.client.spreadsheets.getByDataFilter({
      spreadsheetId: this.id,
      resource: {
        dataFilters: [{ gridRange: { sheetId } }],
      },
      fields: 'sheets.properties,sheets.developerMetadata',
    });

    // Make sure it exists
    if (sheets.length === 0) {
      return null;
    }

    // Check developer metadata
    let metadata = sheets[0].developerMetadata || [];
    if (!metadata.find(({ metadataKey }) => metadataKey === 'orderSheet')) {
      return null;
    }

    return new OrdersSheet({
      client: this.client,
      spreadsheetId: this.id,
      sheetName: sheets[0].properties.title,
    });
  }
}

module.exports = Spreadsheet;
