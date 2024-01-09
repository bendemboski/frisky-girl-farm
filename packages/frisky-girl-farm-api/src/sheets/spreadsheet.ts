import LocationsSheet, { Location } from './locations-sheet';
import UsersSheet from './users-sheet';
import OrdersSheet, { ProductOrderMap } from './orders-sheet';
import log from '../log';
import type { sheets_v4 } from 'googleapis';
import type { PastOrder, User } from '../types';

export default class Spreadsheet {
  private readonly locations: LocationsSheet;
  private readonly users: UsersSheet;
  private readonly orders: OrdersSheet;

  constructor(
    private readonly id: string,
    private readonly client: sheets_v4.Sheets,
  ) {
    this.locations = new LocationsSheet(client, id);
    this.users = new UsersSheet(client, id);
    this.orders = new OrdersSheet(client, id);
  }

  async getLocations(): Promise<Location[]> {
    return await this.locations.getLocations();
  }

  async getUsers(userIds: ReadonlyArray<string>): Promise<User[]> {
    return await this.users.getUsers(userIds);
  }

  async getUser(userId: string): Promise<User> {
    return await this.users.getUser(userId);
  }

  async getProducts(userId: string): Promise<ProductOrderMap> {
    let { products } = await this.orders.getForUser(userId);
    return products;
  }

  async setProductOrder(
    userId: string,
    productId: number,
    quantity: number,
  ): Promise<ProductOrderMap> {
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
   * @param userId the id/email of the user
   */
  async getUserOrders(userId: string): Promise<PastOrder[]> {
    const orderSheetKey = 'orderSheet';

    // Get all order sheets by filtering by developer metadata
    let getResponse = await this.client.spreadsheets.getByDataFilter({
      spreadsheetId: this.id,
      requestBody: {
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
    let sheets = getResponse.data.sheets || [];

    let sheetDates = new Map<number, Date>();
    for (let sheet of sheets) {
      if (sheet.properties!.title === OrdersSheet.openOrdersSheetName) {
        // Ignore the current/open orders sheet
        continue;
      }

      // If the metadata lookup doesn't match any sheets, the API will return all
      // sheets (!), so even though we always expect there to be developerMetadata,
      // let's be defensive.
      let developerMetadata = sheet.developerMetadata || [];
      let metadata = developerMetadata.find(
        (meta) => meta.metadataKey === orderSheetKey,
      );
      if (metadata) {
        sheetDates.set(
          sheet.properties!.sheetId!,
          new Date(metadata.metadataValue!),
        );
      }
    }

    if (sheetDates.size === 0) {
      return [];
    }

    // Now do a batch get of the first columns of all the order sheets so we can
    // look to see which ones include the current user
    let batchGetResponse =
      await this.client.spreadsheets.values.batchGetByDataFilter({
        spreadsheetId: this.id,
        requestBody: {
          dataFilters: Array.from(sheetDates.keys()).map((sheetId) => {
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
    let valueRanges = batchGetResponse.data.valueRanges || [];

    // Now assemble the data into order objects
    let orders: PastOrder[] = [];
    for (let { valueRange, dataFilters } of valueRanges) {
      // If we didn't match any values (which should never happen, but let's be
      // defensive), then instead of `valueRange.values` being an empty array,
      // it will just be missing.
      let values = valueRange!.values || [];
      let column = values[0] || [];

      // values is an array of columns, although we only requested one, so
      // values[0] is the actual column of users that placed an order
      if (!column.includes(userId)) {
        continue;
      }

      // Get the sheet id back out of the data filters the response echoes back
      let sheetId = dataFilters![0].gridRange!.sheetId!;
      // Create an order object!
      orders.push({
        id: sheetId,
        date: sheetDates.get(sheetId)!,
      });
    }
    return orders;
  }

  async getOrdersSheet(sheetId: number): Promise<OrdersSheet | null> {
    let response = await this.client.spreadsheets.getByDataFilter({
      spreadsheetId: this.id,
      requestBody: {
        dataFilters: [{ gridRange: { sheetId } }],
      },
      fields: 'sheets.properties,sheets.developerMetadata',
    });
    let sheets = response.data!.sheets!;

    // Make sure it exists
    if (sheets.length === 0) {
      return null;
    }

    // Check developer metadata
    let metadata = sheets[0].developerMetadata || [];
    if (!metadata.find(({ metadataKey }) => metadataKey === 'orderSheet')) {
      return null;
    }

    return new OrdersSheet(this.client, this.id, sheets[0].properties!.title!);
  }
}
