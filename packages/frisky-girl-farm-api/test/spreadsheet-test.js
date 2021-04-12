require('./support/setup');
const { expect } = require('chai');
const sinon = require('sinon');
const Spreadsheet = require('../src/sheets/spreadsheet');
const {
  OrdersNotOpenError,
  QuantityNotAvailableError,
  UnknownUserError,
} = require('../src/sheets/errors');
const MockSheetsClient = require('./support/mock-sheets-client');

describe('Spreadsheet', function () {
  let client;
  let spreadsheet;

  beforeEach(function () {
    client = new MockSheetsClient();

    client.setLocations();
    client.setUsers();
    client.setOrders(
      [7, 3, 5],
      ['ellen@friskygirlfarm.com', 4, 0, 1],
      ['ashley@friskygirlfarm.com', 3, 2, 0]
    );

    spreadsheet = new Spreadsheet({
      client,
      id: 'ssid',
    });
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
        await spreadsheet.getUser('ashley@friskygirlfarm.com')
      ).to.deep.equal({
        email: 'ashley@friskygirlfarm.com',
        name: 'Ashley Wilson',
        location: 'Wallingford',
        balance: 45.0,
      });
    });

    it('propagates errors', async function () {
      expect(
        spreadsheet.getUser('becky@friskygirlfarm.com')
      ).to.eventually.be.rejectedWith(UnknownUserError);
    });
  });

  it('getUsers', async function () {
    expect(
      (await spreadsheet.getUsers(['ellen@friskygirlfarm.com'])).map(
        (u) => u.email
      )
    ).to.deep.equal(['ellen@friskygirlfarm.com']);
  });

  describe('getProducts', function () {
    it('works', async function () {
      let ret = await spreadsheet.getProducts('ashley@friskygirlfarm.com');
      expect(ret).to.deep.nested.include({
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
        spreadsheet.getProducts('ashley@friskygirlfarm.com')
      ).to.eventually.be.rejectedWith(OrdersNotOpenError);
    });
  });

  describe('setProductOrder', function () {
    it('works', async function () {
      client.stubUpdateOrder();

      let ret = await spreadsheet.setProductOrder(
        'ashley@friskygirlfarm.com',
        3,
        3
      );
      expect(ret).to.deep.nested.include({
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
        spreadsheet.setProductOrder('ashley@friskygirlfarm.com', 3, 6)
      )
        .to.eventually.be.rejectedWith(QuantityNotAvailableError)
        .with.nested.property('extra.available', 4);

      client.resetOrders();
      client.setNoOrders();

      await expect(
        spreadsheet.setProductOrder('ashley@friskygirlfarm.com', 3, 1)
      ).to.eventually.be.rejectedWith(OrdersNotOpenError);
    });
  });

  it('getOrdersSheet', async function () {
    let sheet = spreadsheet.getOrdersSheet('Orders 6-25');

    client.setOrders(
      'Orders 6-25',
      [1, 0, 1],
      ['hasorder@friskygirlfarm.com', 0, 0, 1],
      ['hasnoorder@friskygirlfarm.com', 0, 0, 0],
      ['alsohasorder@friskygirlfarm.com', 1, 0, 1]
    );

    let ret = await sheet.getUsersWithOrders();
    expect(ret).to.deep.equal([
      'hasorder@friskygirlfarm.com',
      'alsohasorder@friskygirlfarm.com',
    ]);
  });
});
