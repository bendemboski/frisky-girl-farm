import './support/setup';
import chai, { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import buildApp from '../src/build-app';
import MockSheetsClient, { MockSheet } from './support/mock-sheets-client';
import Spreadsheet from '../src/sheets/spreadsheet';

describe('API', function () {
  let client: MockSheetsClient;
  let api: ChaiHttp.Agent;
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

    api = chai.request(
      buildApp(() => {
        let spreadsheet = new Spreadsheet('ssid', client.asSheets());
        return spreadsheet;
      }, awsFactory),
    );

    sendEmailsStub = sinon.stub();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('GET /users/:id', function () {
    it('works', async function () {
      let res = await api.get('/users/ashley@friskygirlfarm.com');
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({
        email: 'ashley@friskygirlfarm.com',
        name: 'Ashley Wilson',
        location: 'Wallingford',
        balance: 45.0,
      });
    });

    it('fails when the user is not found', async function () {
      let res = await api.get('/users/becky@friskygirlfarm.com');
      expect(res).to.have.status(404);
      expect(res.body).to.include({ code: 'unknownUser' });
    });
  });

  describe('GET /products', function () {
    it('works', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await api.get('/products?userId=ashley@friskygirlfarm.com');
      expect(res).to.have.status(200);
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

    it('works with 0/unlimited quantities', async function () {
      client.setOrders(
        [0, -1, 2],
        ['ashley@friskygirlfarm.com', 0, 2, 1],
        ['ellen@friskygirlfarm.com', 0, 0, 1],
      );

      let res = await api.get('/products?userId=ashley@friskygirlfarm.com');
      expect(res).to.have.status(200);
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

    it('fails if ordering is not open', async function () {
      client.setNoOrders();
      let res = await api.get('/products?userId=ashley@friskygirlfarm.com');
      expect(res).to.have.status(404);
      expect(res.body).to.include({ code: 'ordersNotOpen' });
    });
  });

  describe('PUT /products/:id', async function () {
    it('works', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );
      client.stubUpdateOrder();

      let res = await api
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res).to.have.status(200);
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

      expect(client.spreadsheets.values.update).to.have.been.calledOnce;
      expect(client.spreadsheets.values.update).to.have.been.calledWithMatch({
        spreadsheetId: 'ssid',
        range: 'Orders!D6',
        requestBody: { values: [[3]] },
      });
    });

    it('works with unlimited quantities', async function () {
      client.setOrders(
        [-1, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );
      client.stubUpdateOrder();

      let res = await api
        .put('/products/1?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 7 });
      expect(res).to.have.status(200);
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

      expect(client.spreadsheets.values.update).to.have.been.calledOnce;
      expect(client.spreadsheets.values.update).to.have.been.calledWithMatch({
        spreadsheetId: 'ssid',
        range: 'Orders!B6',
        requestBody: { values: [[7]] },
      });
    });

    it('fails if the user is unknown', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await api
        .put('/products/3?userId=becky@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res).to.have.status(401);
      expect(res.body).to.include({ code: 'unknownUser' });
    });

    it('fails if `ordered` is missing', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await api
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ blurble: 3 });
      expect(res).to.have.status(400);
      expect(res.body).to.include({ code: 'badInput' });
    });

    it('fails if `ordered` is not a number', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await api
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 'foo' });
      expect(res).to.have.status(400);
      expect(res.body).to.include({ code: 'badInput' });
    });

    it('fails if `ordered` is negative', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await api
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: -2 });
      expect(res).to.have.status(400);
      expect(res.body).to.include({ code: 'badInput' });
    });

    it('fails if ordering is not open', async function () {
      client.setNoOrders();

      let res = await api
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res).to.have.status(404);
      expect(res.body).to.include({ code: 'ordersNotOpen' });
    });

    it('fails if the product is not found', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await api
        .put('/products/9?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res).to.have.status(404);
      expect(res.body).to.include({ code: 'productNotFound' });
    });

    it('fails if the product is not available', async function () {
      client.setOrders(
        [7, 3, 0],
        ['ashley@friskygirlfarm.com', 4, 0, 0],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );

      let res = await api
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res).to.have.status(404);
      expect(res.body).to.include({ code: 'productNotFound' });
    });

    it('fails if the order exceeds the quantity available', async function () {
      client.setOrders(
        [7, 3, 4],
        ['ashley@friskygirlfarm.com', 4, 0, 0],
        ['ellen@friskygirlfarm.com', 3, 2, 2],
      );

      let res = await api
        .put('/products/3?userId=ashley@friskygirlfarm.com')
        .send({ ordered: 3 });
      expect(res).to.have.status(409);
      expect(res.body).to.deep.include({
        code: 'quantityNotAvailable',
        extra: { available: 2 },
      });
    });
  });

  describe('GET /orders', function () {
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

      let res = await api.get('/orders?userId=ashley@friskygirlfarm.com');
      expect(res).to.have.status(200);
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

    it('sorts by date', async function () {
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

      let res = await api.get('/orders?userId=ashley@friskygirlfarm.com');
      expect(res).to.have.status(200);
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

    it('works if the user has not placed any orders', async function () {
      client.setSheetsAndValuesFilterQuery({});

      let res = await api.get('/orders?userId=ashley@friskygirlfarm.com');
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({ orders: [] });
    });
  });

  describe('GET /orders/:id', function () {
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

      client.setPastOrders(
        'Orders 6-25',
        [7, 3, 5],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
      );

      let res = await api.get('/orders/12345?userId=ashley@friskygirlfarm.com');

      expect(getStub).to.have.been.calledOnce;
      expect(getStub.firstCall.args[0].requestBody?.dataFilters).to.deep.equal([
        { gridRange: { sheetId: 12345 } },
      ]);

      expect(res).to.have.status(200);
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

    it('works if the sheet is not found', async function () {
      getStub.resolves({
        data: {
          sheets: [],
        },
      });

      let res = await api.get('/orders/12345?userId=ashley@friskygirlfarm.com');

      expect(res).to.have.status(404);
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

    it('it works', async function () {
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

      let res = await api
        .post('/admin/confirmation-emails')
        .send({ sheetId: 123 });
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({ failedSends: [] });

      expect(getStub).to.have.been.calledOnce;
      expect(getStub).to.have.been.calledWithMatch({
        spreadsheetId: 'ssid',
        requestBody: {
          dataFilters: [{ gridRange: { sheetId: 123 } }],
        },
      });

      expect(sendEmailsStub).to.have.been.calledOnce;
      expect(sendEmailsStub).to.have.been.calledWithMatch({
        Source: 'friskygirlfarm@gmail.com',
        Template: 'order_confirmation',
        ConfigurationSetName: 'default',
        Destinations: [
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
        ],
      });
    });

    it('it reports send errors', async function () {
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

      let res = await api
        .post('/admin/confirmation-emails')
        .send({ sheetId: 123 });
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({
        failedSends: ['ellen@friskygirlfarm.com', 'ashley@friskygirlfarm.com'],
      });
    });

    it('it fails if the sheet id is not specified', async function () {
      let res = await api.post('/admin/confirmation-emails').send();
      expect(res).to.have.status(400);
    });

    it('it fails if the sheet is not found', async function () {
      stubSheets([]);

      let res = await api
        .post('/admin/confirmation-emails')
        .send({ sheetId: 99999 });
      expect(res).to.have.status(400);
    });

    it('it fails if the sheet id is not an orders sheet', async function () {
      stubSheets([{ properties: { title: 'Orders 4-20' } }]);

      let res = await api
        .post('/admin/confirmation-emails')
        .send({ sheetId: 99999 });
      expect(res).to.have.status(400);
    });
  });
});
