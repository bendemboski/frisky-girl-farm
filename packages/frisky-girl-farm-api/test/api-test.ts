import { describe, beforeEach, afterEach, test, expect } from 'vitest';
import { type Express } from 'express';
import sinon, { SinonStub } from 'sinon';
import buildApp from '../src/build-app';
import request from 'supertest';
import MockSheetsClient, { MockSheet } from './support/mock-sheets-client';
import Spreadsheet from '../src/sheets/spreadsheet';

describe('API', function () {
  let client: MockSheetsClient;
  let app: Express;
  let sendEmailsStub: SinonStub;

  class SESStub {
    sendBulkTemplatedEmail(...args: unknown[]) {
      return { promise: () => sendEmailsStub(...args) };
    }
  }
  const awsFactory = () => ({ SES: SESStub }) as typeof import('aws-sdk');

  beforeEach(function () {
    client = new MockSheetsClient();
    client.setUsers();
    app = buildApp(() => {
      let spreadsheet = new Spreadsheet('ssid', client.asSheets());
      return spreadsheet;
    }, awsFactory);

    sendEmailsStub = sinon.stub();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('GET /users/:id', function () {
    test('works', async function () {
      let res = await request(app).get('/users/ashley@friskygirlfarm.com');
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        email: 'ashley@friskygirlfarm.com',
        name: 'Ashley Wilson',
        location: 'Wallingford',
        balance: 45.0,
      });
    });

    test('fails when the user is not found', async function () {
      let res = await request(app).get('/users/becky@friskygirlfarm.com');
      expect(res.status).toEqual(404);
      expect(res.body).to.include({ code: 'unknownUser' });
    });
  });

  describe('GET /products', function () {
    test('works', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await request(app).get(
        '/products?userId=ashley@friskygirlfarm.com',
      );
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        products: [
          {
            id: '1',
            name: 'Lettuce',
            imageUrl: 'http://lettuce.com/image.jpg',
            price: 0.15,
            available: 4,
            ordered: 4,
          },
          {
            id: '2',
            name: 'Kale',
            imageUrl: 'http://kale.com/image.jpg',
            price: 0.85,
            available: 1,
            ordered: 0,
          },
          {
            id: '3',
            name: 'Spicy Greens',
            imageUrl: 'http://spicy-greens.com/image.jpg',
            price: 15.0,
            available: 5,
            ordered: 1,
          },
        ],
      });
    });

    test('works with 0/unlimited quantities', async function () {
      client.setOrders(
        [0, -1, 2],
        ['ashley@friskygirlfarm.com', 0, 2, 1],
        ['ellen@friskygirlfarm.com', 0, 0, 1],
      );

      let res = await request(app).get(
        '/products?userId=ashley@friskygirlfarm.com',
      );
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        products: [
          {
            id: '2',
            name: 'Kale',
            imageUrl: 'http://kale.com/image.jpg',
            price: 0.85,
            available: -1,
            ordered: 2,
          },
          {
            id: '3',
            name: 'Spicy Greens',
            imageUrl: 'http://spicy-greens.com/image.jpg',
            price: 15.0,
            available: 1,
            ordered: 1,
          },
        ],
      });
    });

    test('fails if ordering is not open', async function () {
      client.setNoOrders();
      let res = await request(app).get(
        '/products?userId=ashley@friskygirlfarm.com',
      );
      expect(res.status).toEqual(404);
      expect(res.body).to.include({ code: 'ordersNotOpen' });
    });
  });

  describe('PUT /products/:id', async function () {
    test('works', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );
      client.stubUpdateOrder();

      let res = await request(app)
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        products: [
          {
            id: '1',
            name: 'Lettuce',
            imageUrl: 'http://lettuce.com/image.jpg',
            price: 0.15,
            available: 4,
            ordered: 4,
          },
          {
            id: '2',
            name: 'Kale',
            imageUrl: 'http://kale.com/image.jpg',
            price: 0.85,
            available: 1,
            ordered: 0,
          },
          {
            id: '3',
            name: 'Spicy Greens',
            imageUrl: 'http://spicy-greens.com/image.jpg',
            price: 15.0,
            available: 5,
            ordered: 3,
          },
        ],
      });

      expect(client.spreadsheets.values.update.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.update.lastCall.args[0]?.spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.update.lastCall.args[0]?.range).toEqual(
        'Orders!D6',
      );
      expect(
        client.spreadsheets.values.update.lastCall.args[0]?.requestBody,
      ).toEqual({ values: [[3]] });
    });

    test('works with unlimited quantities', async function () {
      client.setOrders(
        [-1, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );
      client.stubUpdateOrder();

      let res = await request(app)
        .put('/products/1?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 7 });
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        products: [
          {
            id: '1',
            name: 'Lettuce',
            imageUrl: 'http://lettuce.com/image.jpg',
            price: 0.15,
            available: -1,
            ordered: 7,
          },
          {
            id: '2',
            name: 'Kale',
            imageUrl: 'http://kale.com/image.jpg',
            price: 0.85,
            available: 1,
            ordered: 0,
          },
          {
            id: '3',
            name: 'Spicy Greens',
            imageUrl: 'http://spicy-greens.com/image.jpg',
            price: 15.0,
            available: 5,
            ordered: 1,
          },
        ],
      });

      expect(client.spreadsheets.values.update.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.update.lastCall.args[0]?.spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.update.lastCall.args[0]?.range).toEqual(
        'Orders!B6',
      );
      expect(
        client.spreadsheets.values.update.lastCall.args[0]?.requestBody,
      ).toEqual({ values: [[7]] });
    });

    test('fails if the user is unknown', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await request(app)
        .put('/products/3?userId=becky@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res.status).toEqual(401);
      expect(res.body).to.include({ code: 'unknownUser' });
    });

    test('fails if `ordered` is missing', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await request(app)
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ blurble: 3 });
      expect(res.status).toEqual(400);
      expect(res.body).to.include({ code: 'badInput' });
    });

    test('fails if `ordered` is not a number', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await request(app)
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 'foo' });
      expect(res.status).toEqual(400);
      expect(res.body).to.include({ code: 'badInput' });
    });

    test('fails if `ordered` is negative', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await request(app)
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: -2 });
      expect(res.status).toEqual(400);
      expect(res.body).to.include({ code: 'badInput' });
    });

    test('fails if ordering is not open', async function () {
      client.setNoOrders();

      let res = await request(app)
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res.status).toEqual(404);
      expect(res.body).to.include({ code: 'ordersNotOpen' });
    });

    test('fails if the product is not found', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await request(app)
        .put('/products/9?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res.status).toEqual(404);
      expect(res.body).to.include({ code: 'productNotFound' });
    });

    test('fails if the product is not available', async function () {
      client.setOrders(
        [7, 3, 0],
        ['ashley@friskygirlfarm.com', 4, 0, 0],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await request(app)
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res.status).toEqual(404);
      expect(res.body).to.include({ code: 'productNotFound' });
    });

    test('fails if the order exceeds the quantity available', async function () {
      client.setOrders(
        [7, 3, 4],
        ['ashley@friskygirlfarm.com', 4, 0, 0],
        ['ellen@friskygirlfarm.com', 3, 2, 2],
      );

      let res = await request(app)
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res.status).toEqual(409);
      expect(res.body).to.deep.include({
        code: 'quantityNotAvailable',
        extra: { available: 2 },
      });
    });
  });

  describe('GET /orders', function () {
    test('works', async function () {
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

      let res = await request(app).get(
        '/orders?userId=ashley@friskygirlfarm.com',
      );
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        orders: [
          {
            id: 1,
            date: new Date(2021, 2, 18).toISOString(),
          },
          {
            id: 3,
            date: new Date(2021, 1, 14).toISOString(),
          },
        ],
      });
    });

    test('sorts by date', async function () {
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
          values: ['ashley@friskygirlfarm.com'],
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
          values: ['ashley@friskygirlfarm.com'],
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
          values: ['ashley@friskygirlfarm.com'],
        },
      });

      let res = await request(app).get(
        '/orders?userId=ashley@friskygirlfarm.com',
      );
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        orders: [
          {
            id: 2,
            date: new Date(2021, 3, 20).toISOString(),
          },
          {
            id: 1,
            date: new Date(2021, 2, 18).toISOString(),
          },
          {
            id: 3,
            date: new Date(2021, 1, 14).toISOString(),
          },
        ],
      });
    });

    test('works if the user has not placed any orders', async function () {
      client.setSheetsAndValuesFilterQuery({});

      let res = await request(app).get(
        '/orders?userId=ashley@friskygirlfarm.com',
      );
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({ orders: [] });
    });
  });

  describe('GET /orders/:id', function () {
    let getStub: typeof client.spreadsheets.getByDataFilter;

    beforeEach(function () {
      getStub = client.spreadsheets.getByDataFilter;
    });

    test('works', async function () {
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

      client.setPastOrders(
        'Orders 6-25',
        [7, 3, 5],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
      );

      let res = await request(app).get(
        '/orders/12345?userId=ashley@friskygirlfarm.com',
      );

      expect(getStub.callCount).toEqual(1);
      expect(getStub.firstCall.args[0].requestBody?.dataFilters).toEqual([
        { gridRange: { sheetId: 12345 } },
      ]);

      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        products: [
          {
            name: 'Lettuce',
            imageUrl: 'http://lettuce.com/image.jpg',
            price: 0.15,
            ordered: 4,
          },
          {
            name: 'Kale',
            imageUrl: 'http://kale.com/image.jpg',
            price: 0.85,
            ordered: 0,
          },
          {
            name: 'Spicy Greens',
            imageUrl: 'http://spicy-greens.com/image.jpg',
            price: 15.0,
            ordered: 1,
          },
        ],
      });
    });

    test('works if the sheet is not found', async function () {
      getStub.resolves({
        data: {
          sheets: [],
        },
      });

      let res = await request(app).get(
        '/orders/12345?userId=ashley@friskygirlfarm.com',
      );

      expect(res.status).toEqual(404);
    });
  });

  describe('POST /admin/confirmation-emails', function () {
    let getStub: typeof client.spreadsheets.getByDataFilter;

    beforeEach(function () {
      getStub = client.spreadsheets.getByDataFilter;
    });

    function stubSheets(sheets: ReadonlyArray<MockSheet>) {
      getStub.resolves({ data: { sheets } });
    }

    test('it works', async function () {
      stubSheets([
        {
          properties: { title: 'Orders 4-20' },
          developerMetadata: [{ metadataKey: 'orderSheet' }],
        },
      ]);

      client.setUsers([
        [
          'herbie@friskygirlfarm.com',
          'Herb Dog',
          'Lake City',
          35.0,
          100.0,
          65.0,
        ],
      ]);
      client.setLocations();
      client.setOrdersForSheet(
        'Orders 4-20',
        [1, 0, 1],
        ['ashley@friskygirlfarm.com', 0, 0, 1],
        ['ellen@friskygirlfarm.com', 0, 0, 0],
        ['herbie@friskygirlfarm.com', 1, 0, 1],
      );

      sendEmailsStub.resolves({
        Status: [{ Status: 'Success' }, { Status: 'Success' }],
      });

      let res = await request(app)
        .post('/admin/confirmation-emails')
        .send({ sheetId: 123 });
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({ failedSends: [] });

      expect(getStub.callCount).toEqual(1);
      expect(getStub.lastCall.args[0].spreadsheetId).toEqual('ssid');
      expect(getStub.lastCall.args[0].requestBody?.dataFilters).toEqual([
        { gridRange: { sheetId: 123 } },
      ]);

      expect(sendEmailsStub.callCount).toEqual(1);
      expect(sendEmailsStub.lastCall.args[0].Source).toEqual(
        'friskygirlfarm@gmail.com',
      );
      expect(sendEmailsStub.lastCall.args[0].Template).toEqual(
        'order_confirmation',
      );
      expect(sendEmailsStub.lastCall.args[0].ConfigurationSetName).toEqual(
        'default',
      );
      expect(sendEmailsStub.lastCall.args[0].Destinations).toEqual([
        {
          Destination: { ToAddresses: ['ashley@friskygirlfarm.com'] },
          ReplacementTemplateData: JSON.stringify({
            pickupInstructions:
              'Come for the veggies, stay for the neighborhood character',
          }),
        },
        {
          Destination: { ToAddresses: ['herbie@friskygirlfarm.com'] },
          ReplacementTemplateData: JSON.stringify({
            pickupInstructions: 'Like a city, but also a lake',
          }),
        },
      ]);
    });

    test('it reports send errors', async function () {
      stubSheets([
        {
          properties: { title: 'Orders 4-20' },
          developerMetadata: [{ metadataKey: 'orderSheet' }],
        },
      ]);

      client.setLocations();
      client.setOrdersForSheet(
        'Orders 4-20',
        [1, 0, 1],
        ['ashley@friskygirlfarm.com', 0, 0, 1],
        ['ellen@friskygirlfarm.com', 1, 0, 0],
      );

      sendEmailsStub.resolves({
        Status: [{ Status: 'MessageRejected' }, { Status: 'MessageRejected' }],
      });

      let res = await request(app)
        .post('/admin/confirmation-emails')
        .send({ sheetId: 123 });
      expect(res.status).toEqual(200);
      expect(res.body).to.deep.equal({
        failedSends: ['ellen@friskygirlfarm.com', 'ashley@friskygirlfarm.com'],
      });
    });

    test('it fails if the sheet id is not specified', async function () {
      let res = await request(app).post('/admin/confirmation-emails').send();
      expect(res.status).toEqual(400);
    });

    test('it fails if the sheet is not found', async function () {
      stubSheets([]);

      let res = await request(app)
        .post('/admin/confirmation-emails')
        .send({ sheetId: 99999 });
      expect(res.status).toEqual(400);
    });

    test('it fails if the sheet id is not an orders sheet', async function () {
      stubSheets([{ properties: { title: 'Orders 4-20' } }]);

      let res = await request(app)
        .post('/admin/confirmation-emails')
        .send({ sheetId: 99999 });
      expect(res.status).toEqual(400);
    });
  });
});
