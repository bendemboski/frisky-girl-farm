import './support/setup';
import { expect } from 'chai';
import sinon from 'sinon';
import Spreadsheet from '../src/sheets/spreadsheet';
import {
  OrdersNotOpenError,
  QuantityNotAvailableError,
  UnknownUserError,
} from '../src/sheets/errors';
import MockSheetsClient from './support/mock-sheets-client';

describe('Spreadsheet', function () {
  let client: MockSheetsClient;
  let spreadsheet: Spreadsheet;

  beforeEach(function () {
    client = new MockSheetsClient();

    client.setLocations();
    client.setUsers();
    client.setOrders(
      [7, 3, 5],
      ['ellen@friskygirlfarm.com', 4, 0, 1],
      ['ashley@friskygirlfarm.com', 3, 2, 0],
    );

    spreadsheet = new Spreadsheet('ssid', client.asSheets());
  });

  afterEach(function () {
    sinon.restore();
  });

  it('getLocations', async function () {
    expect(await spreadsheet.getLocations()).to.deep.equal([
      {
        name: 'Wallingford',
        pickupInstructions:
          'Come for the veggies, stay for the neighborhood character',
      },
      {
        name: 'Lake City',
        pickupInstructions: 'Like a city, but also a lake',
      },
    ]);
  });

  describe('getUser', function () {
    it('works', async function () {
      expect(
        await spreadsheet.getUser('ashley@friskygirlfarm.com'),
      ).to.deep.equal({
        email: 'ashley@friskygirlfarm.com',
        name: 'Ashley Wilson',
        location: 'Wallingford',
        balance: 45.0,
      });
    });

    it('propagates errors', async function () {
      expect(
        spreadsheet.getUser('becky@friskygirlfarm.com'),
      ).to.eventually.be.rejectedWith(UnknownUserError);
    });
  });

  it('getUsers', async function () {
    expect(
      (await spreadsheet.getUsers(['ellen@friskygirlfarm.com'])).map(
        (u) => u.email,
      ),
    ).to.deep.equal(['ellen@friskygirlfarm.com']);
  });

  describe('getProducts', function () {
    it('works', async function () {
      let ret = await spreadsheet.getProducts('ashley@friskygirlfarm.com');
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.name': 'Lettuce',
        '1.imageUrl': 'http://lettuce.com/image.jpg',
        '1.price': 0.15,
        '1.available': 3,
        '1.ordered': 3,
        '2.name': 'Kale',
        '2.imageUrl': 'http://kale.com/image.jpg',
        '2.price': 0.85,
        '2.available': 3,
        '2.ordered': 2,
        '3.name': 'Spicy Greens',
        '3.imageUrl': 'http://spicy-greens.com/image.jpg',
        '3.price': 15.0,
        '3.available': 4,
        '3.ordered': 0,
      });
    });

    it('propagates errors', async function () {
      client.setNoOrders();
      await expect(
        spreadsheet.getProducts('ashley@friskygirlfarm.com'),
      ).to.eventually.be.rejectedWith(OrdersNotOpenError);
    });
  });

  describe('setProductOrder', function () {
    it('works', async function () {
      client.stubUpdateOrder();

      let ret = await spreadsheet.setProductOrder(
        'ashley@friskygirlfarm.com',
        3,
        3,
      );
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.available': 3,
        '1.ordered': 3,
        '2.available': 3,
        '2.ordered': 2,
        '3.available': 4,
        '3.ordered': 3,
      });
    });

    it('propagates errors', async function () {
      await expect(
        spreadsheet.setProductOrder('ashley@friskygirlfarm.com', 3, 6),
      )
        .to.eventually.be.rejectedWith(QuantityNotAvailableError)
        .with.nested.property('extra.available', 4);

      client.resetOrders();
      client.setNoOrders();

      await expect(
        spreadsheet.setProductOrder('ashley@friskygirlfarm.com', 3, 1),
      ).to.eventually.be.rejectedWith(OrdersNotOpenError);
    });
  });

  describe('getUserOrders', function () {
    it('works', async function () {
      client.setSheetsAndValuesFilterQuery({
        [1]: {
          developerMetadata: [
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 2, 18).toISOString(),
            },
          ],
          properties: {
            title: 'Orders 3-18',
          },
          values: ['ashley@friskygirlfarm.com', 'ellen@friskygirlfarm.com'],
        },
        [2]: {
          developerMetadata: [
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 3, 20).toISOString(),
            },
          ],
          properties: {
            title: 'Orders 4-20',
          },
          values: ['herbie@firskygirlfarm.com', 'ellen@friskygirlfarm.com'],
        },
        [3]: {
          developerMetadata: [
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 1, 14).toISOString(),
            },
          ],
          properties: {
            title: 'Orders 2-14',
          },
          values: ['herbie@firskygirlfarm.com', 'ashley@friskygirlfarm.com'],
        },
      });

      await expect(
        spreadsheet.getUserOrders('ashley@friskygirlfarm.com'),
      ).to.eventually.deep.equal([
        {
          id: 1,
          date: new Date(2021, 2, 18),
        },
        {
          id: 3,
          date: new Date(2021, 1, 14),
        },
      ]);

      expect(client.spreadsheets.getByDataFilter).to.have.been.calledOnce;
      expect(
        client.spreadsheets.getByDataFilter.firstCall.args[0],
      ).to.deep.equal({
        spreadsheetId: 'ssid',
        requestBody: {
          dataFilters: [
            {
              developerMetadataLookup: {
                metadataLocation: {
                  locationType: 'SHEET',
                },
                metadataKey: 'orderSheet',
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

      expect(client.spreadsheets.values.batchGetByDataFilter).to.have.been
        .calledOnce;
      expect(
        client.spreadsheets.values.batchGetByDataFilter.firstCall.args[0],
      ).to.deep.equal({
        spreadsheetId: 'ssid',
        requestBody: {
          dataFilters: [
            {
              gridRange: {
                sheetId: 1,
                startColumnIndex: 0,
                endColumnIndex: 1,
                startRowIndex: 5,
              },
            },
            {
              gridRange: {
                sheetId: 2,
                startColumnIndex: 0,
                endColumnIndex: 1,
                startRowIndex: 5,
              },
            },
            {
              gridRange: {
                sheetId: 3,
                startColumnIndex: 0,
                endColumnIndex: 1,
                startRowIndex: 5,
              },
            },
          ],
          majorDimension: 'COLUMNS',
        },
      });
    });

    it('works with other developer metadata present', async function () {
      client.setSheetsAndValuesFilterQuery({
        [1]: {
          developerMetadata: [
            {
              metadataKey: 'somethingElse',
              metadataValue: 'whee',
            },
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 2, 18).toISOString(),
            },
          ],
          properties: {
            title: 'Orders 3-18',
          },
          values: ['ashley@friskygirlfarm.com', 'ellen@friskygirlfarm.com'],
        },
      });

      await expect(
        spreadsheet.getUserOrders('ashley@friskygirlfarm.com'),
      ).to.eventually.deep.equal([
        {
          id: 1,
          date: new Date(2021, 2, 18),
        },
      ]);

      // Verify that the get values queried sheet1
      expect(
        client.spreadsheets.values.batchGetByDataFilter.firstCall.args[0].requestBody!.dataFilters!.map(
          (f) => f.gridRange?.sheetId,
        ),
      ).to.deep.equal([1]);
    });

    it('ignores the open orders sheet and non-order sheets', async function () {
      client.setSheetsFilterQuery({
        [1]: {
          developerMetadata: [
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 2, 18).toISOString(),
            },
          ],
          properties: {
            title: 'Orders 3-18',
          },
          values: ['ashley@friskygirlfarm.com', 'ellen@friskygirlfarm.com'],
        },
        [2]: {
          developerMetadata: [
            {
              metadataKey: 'somethingElse',
              metadataValue: new Date(2021, 2, 18).toISOString(),
            },
          ],
          properties: {
            title: 'Something else',
          },
          values: ['herbie@firskygirlfarm.com', 'ashley@friskygirlfarm.com'],
        },
        [3]: {
          values: ['herbie@firskygirlfarm.com', 'ashley@friskygirlfarm.com'],
        },
        [4]: {
          developerMetadata: [
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 1, 14).toISOString(),
            },
          ],
          properties: {
            title: 'Orders',
          },
          values: ['ashley@friskygirlfarm.com', 'ellen@friskygirlfarm.com'],
        },
      });

      client.setValuesFilterQuery({
        [1]: {
          developerMetadata: [
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 2, 18).toISOString(),
            },
          ],
          properties: {
            title: 'Orders 3-18',
          },
          values: ['ashley@friskygirlfarm.com', 'ellen@friskygirlfarm.com'],
        },
      });

      await expect(
        spreadsheet.getUserOrders('ashley@friskygirlfarm.com'),
      ).to.eventually.deep.equal([
        {
          id: 1,
          date: new Date(2021, 2, 18),
        },
      ]);

      // Verify that the get values queried sheet1, and ignored sheet2 and
      // sheet3
      expect(
        client.spreadsheets.values.batchGetByDataFilter.firstCall.args[0].requestBody!.dataFilters!.map(
          (f) => f.gridRange?.sheetId,
        ),
      ).to.deep.equal([1]);
    });

    it('works with no order sheets', async function () {
      client.setSheetsAndValuesFilterQuery({});

      await expect(
        spreadsheet.getUserOrders('ashley@friskygirlfarm.com'),
      ).to.eventually.deep.equal([]);

      // Verify that no values query was issued
      expect(client.spreadsheets.values.batchGetByDataFilter).to.not.have.been
        .called;
    });

    it('works with no values', async function () {
      client.setSheetsFilterQuery({
        [1]: {
          developerMetadata: [
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 2, 18).toISOString(),
            },
          ],
          properties: {
            title: 'Orders 3-18',
          },
        },
      });

      client.spreadsheets.values.batchGetByDataFilter =
        client.spreadsheets.values.batchGetByDataFilter || sinon.stub();

      client.spreadsheets.values.batchGetByDataFilter.resolves({
        data: {
          valueRanges: [
            {
              valueRange: {},
              dataFilters: [{ gridRange: { sheetId: 1 } }],
            },
          ],
        },
      });

      await expect(
        spreadsheet.getUserOrders('ashley@friskygirlfarm.com'),
      ).to.eventually.deep.equal([]);
    });

    it('works with no sheets that include the current user', async function () {
      client.setSheetsAndValuesFilterQuery({
        [1]: {
          developerMetadata: [
            {
              metadataKey: 'orderSheet',
              metadataValue: new Date(2021, 2, 18).toISOString(),
            },
          ],
          properties: {
            title: 'Orders 3-18',
          },
          values: ['herbie@friskygirlfarm.com', 'ellen@friskygirlfarm.com'],
        },
      });

      await expect(
        spreadsheet.getUserOrders('ashley@friskygirlfarm.com'),
      ).to.eventually.deep.equal([]);
    });
  });

  describe('getOrdersSheet', function () {
    let getStub: typeof client.spreadsheets.getByDataFilter;

    beforeEach(function () {
      getStub = client.spreadsheets.getByDataFilter;
    });

    it('works', async function () {
      getStub.resolves({
        data: {
          sheets: [
            {
              properties: { title: 'Orders 6-25' },
              developerMetadata: [
                {
                  metadataKey: 'orderSheet',
                  metadataValue: new Date(2021, 5, 25).toISOString(),
                },
              ],
            },
          ],
        },
      });

      let sheet = await spreadsheet.getOrdersSheet(12345);

      // Make sure the getByDataFilter API was called correctly
      expect(getStub).to.have.been.calledOnce;
      expect(getStub.firstCall.args[0].spreadsheetId).to.equal('ssid');
      expect(getStub.firstCall.args[0].requestBody?.dataFilters).to.deep.equal([
        { gridRange: { sheetId: 12345 } },
      ]);
      expect(getStub.firstCall.args[0].fields?.split(',')).to.include(
        'sheets.properties',
      );
      expect(getStub.firstCall.args[0].fields?.split(',')).to.include(
        'sheets.developerMetadata',
      );

      // Make sure the returned sheet works
      client.setOrdersForSheet(
        'Orders 6-25',
        [1, 0, 1],
        ['hasorder@friskygirlfarm.com', 0, 0, 1],
        ['hasnoorder@friskygirlfarm.com', 0, 0, 0],
        ['alsohasorder@friskygirlfarm.com', 1, 0, 1],
      );

      let ret = await sheet!.getUsersWithOrders();
      expect(ret).to.deep.equal([
        'hasorder@friskygirlfarm.com',
        'alsohasorder@friskygirlfarm.com',
      ]);
    });

    it('handles the sheet not being found', async function () {
      getStub.resolves({ data: { sheets: [] } });
      let sheet = await spreadsheet.getOrdersSheet(12345);
      expect(sheet).to.be.null;
    });

    it('handles other metadata being present', async function () {
      getStub.resolves({
        data: {
          sheets: [
            {
              properties: { title: 'Orders 6-25' },
              developerMetadata: [
                {
                  metadataKey: 'somethingElse',
                  metadataValue: 'stuff',
                },
                {
                  metadataKey: 'orderSheet',
                  metadataValue: new Date(2021, 5, 25).toISOString(),
                },
              ],
            },
          ],
        },
      });
      let sheet = await spreadsheet.getOrdersSheet(12345);

      // Make sure the returned sheet works
      client.setOrdersForSheet(
        'Orders 6-25',
        [1, 0, 1],
        ['hasorder@friskygirlfarm.com', 0, 0, 1],
        ['hasnoorder@friskygirlfarm.com', 0, 0, 0],
        ['alsohasorder@friskygirlfarm.com', 1, 0, 1],
      );

      let ret = await sheet!.getUsersWithOrders();
      expect(ret).to.deep.equal([
        'hasorder@friskygirlfarm.com',
        'alsohasorder@friskygirlfarm.com',
      ]);
    });
  });
});
