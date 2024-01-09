import { describe, beforeEach, afterEach, test, expect } from 'vitest';
import sinon from 'sinon';
import OrdersSheet from '../src/sheets/orders-sheet';
import {
  OrdersNotOpenError,
  NegativeQuantityError,
  ProductNotFoundError,
  QuantityNotAvailableError,
} from '../src/sheets/errors';
import MockSheetsClient from './support/mock-sheets-client';

describe('OrdersSheet', function () {
  let client: MockSheetsClient;
  let sheet: OrdersSheet;

  beforeEach(function () {
    client = new MockSheetsClient();
    sheet = new OrdersSheet(client.asSheets(), 'ssid');
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('getForUser', function () {
    test('includes name, image URL and price', async function () {
      client.setOrders([1, 1, 1]);

      let ret = await sheet.getForUser('ashley@friskygirlfarm.com');
      let products = Object.fromEntries(ret.products?.entries() || []);
      expect(products).to.have.keys('1', '2', '3');
      expect(products).to.deep.nested.include({
        '1.name': 'Lettuce',
        '1.imageUrl': 'http://lettuce.com/image.jpg',
        '1.price': 0.15,
        '2.name': 'Kale',
        '2.imageUrl': 'http://kale.com/image.jpg',
        '2.price': 0.85,
        '3.name': 'Spicy Greens',
        '3.imageUrl': 'http://spicy-greens.com/image.jpg',
        '3.price': 15.0,
      });
    });

    test('omits products with a limit of 0', async function () {
      client.setOrders([1, 0, 1]);

      let ret = await sheet.getForUser('ashley@friskygirlfarm.com');
      let products = Object.fromEntries(ret.products?.entries() || []);
      expect(products).to.have.keys('1', '3');
      expect(products).to.deep.nested.include({
        '1.name': 'Lettuce',
        '3.name': 'Spicy Greens',
      });
    });

    test('works with no users', async function () {
      client.setOrders([7, 3, 5]);

      let ret = await sheet.getForUser('ashley@friskygirlfarm.com');
      let products = Object.fromEntries(ret.products?.entries() || []);
      expect(products).to.deep.nested.include({
        '1.available': 7,
        '1.ordered': 0,
        '2.available': 3,
        '2.ordered': 0,
        '3.available': 5,
        '3.ordered': 0,
      });
    });

    test('works when the user has no row', async function () {
      client.setOrders(
        [7, 3, 5],
        ['uid1', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 2],
      );

      let ret = await sheet.getForUser('ashley@friskygirlfarm.com');
      let products = Object.fromEntries(ret.products?.entries() || []);
      expect(products).to.deep.nested.include({
        '1.available': 0,
        '1.ordered': 0,
        '2.available': 1,
        '2.ordered': 0,
        '3.available': 2,
        '3.ordered': 0,
      });
    });

    test('works when the user has a row', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 2],
      );

      let ret = await sheet.getForUser('ashley@friskygirlfarm.com');
      let products = Object.fromEntries(ret.products?.entries() || []);
      expect(products).to.deep.nested.include({
        '1.available': 4,
        '1.ordered': 4,
        '2.available': 1,
        '2.ordered': 0,
        '3.available': 3,
        '3.ordered': 1,
      });
    });

    test('works with blank user cells', async function () {
      client.setOrders(
        [7, 3, 5],
        ['ashley@friskygirlfarm.com', 4, '', 1],
        ['ellen@friskygirlfarm.com', 3, 2, ''],
      );

      let ret = await sheet.getForUser('ashley@friskygirlfarm.com');
      let products = Object.fromEntries(ret.products?.entries() || []);
      expect(products).to.deep.nested.include({
        '1.available': 4,
        '1.ordered': 4,
        '2.available': 1,
        '2.ordered': 0,
        '3.available': 5,
        '3.ordered': 1,
      });
    });

    test('fails if there is no orders sheet', async function () {
      client.setNoOrders();
      await expect(
        sheet.getForUser('ashley@friskygirlfarm.com'),
      ).rejects.toThrow(OrdersNotOpenError);
    });
  });

  describe('setOrdered', function () {
    beforeEach(function () {
      client.stubUpdateOrder();
    });

    test('works when the user has no row', async function () {
      client.setOrders(
        [7, 3, 5],
        ['uid1', 4, 0, 1],
        ['ellen@friskygirlfarm.com', 3, 2, 0],
      );
      client.stubAppendOrder();

      let ret = await sheet.setOrdered('ashley@friskygirlfarm.com', 3, 2);
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.available': 0,
        '1.ordered': 0,
        '2.available': 1,
        '2.ordered': 0,
        '3.available': 4,
        '3.ordered': 2,
      });

      expect(client.spreadsheets.values.append.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.append.firstCall.args[0].spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.append.firstCall.args[0].range).toEqual(
        'Orders!A6',
      );
      expect(
        client.spreadsheets.values.append.firstCall.args[0].requestBody,
      ).toEqual({
        values: [['ashley@friskygirlfarm.com', undefined, undefined, 2]],
      });
    });

    test('works when the user has a row', async function () {
      client.setOrders(
        [7, 3, 5],
        ['uid1', 4, 0, 1],
        ['ashley@friskygirlfarm.com', 3, 0, 0],
      );

      let ret = await sheet.setOrdered('ashley@friskygirlfarm.com', 3, 2);
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.available': 3,
        '1.ordered': 3,
        '2.available': 3,
        '2.ordered': 0,
        '3.available': 4,
        '3.ordered': 2,
      });

      expect(client.spreadsheets.values.update.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.update.lastCall.args[0].spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.update.lastCall.args[0].range).toEqual(
        'Orders!D7',
      );
      expect(
        client.spreadsheets.values.update.lastCall.args[0].requestBody,
      ).toEqual({ values: [[2]] });
    });

    test('works for increasing the quantity of a product', async function () {
      client.setOrders(
        [7, 3, 6],
        ['uid1', 4, 0, 1],
        ['ashley@friskygirlfarm.com', 3, 0, 1],
      );

      let ret = await sheet.setOrdered('ashley@friskygirlfarm.com', 3, 3);
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.available': 3,
        '1.ordered': 3,
        '2.available': 3,
        '2.ordered': 0,
        '3.available': 5,
        '3.ordered': 3,
      });

      expect(client.spreadsheets.values.update.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.update.lastCall.args[0].spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.update.lastCall.args[0].range).toEqual(
        'Orders!D7',
      );
      expect(
        client.spreadsheets.values.update.lastCall.args[0].requestBody,
      ).toEqual({ values: [[3]] });
    });

    test('works for decreasing the quantity of a product', async function () {
      client.setOrders(
        [7, 3, 6],
        ['uid1', 4, 0, 1],
        ['ashley@friskygirlfarm.com', 3, 0, 3],
      );

      let ret = await sheet.setOrdered('ashley@friskygirlfarm.com', 3, 2);
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.available': 3,
        '1.ordered': 3,
        '2.available': 3,
        '2.ordered': 0,
        '3.available': 5,
        '3.ordered': 2,
      });

      expect(client.spreadsheets.values.update.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.update.lastCall.args[0].spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.update.lastCall.args[0].range).toEqual(
        'Orders!D7',
      );
      expect(
        client.spreadsheets.values.update.lastCall.args[0].requestBody,
      ).toEqual({ values: [[2]] });
    });

    test('works for zeroing out the quantity of a product', async function () {
      client.setOrders(
        [7, 3, 6],
        ['uid1', 4, 0, 1],
        ['ashley@friskygirlfarm.com', 3, 0, 3],
      );

      let ret = await sheet.setOrdered('ashley@friskygirlfarm.com', 3, 0);
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.available': 3,
        '1.ordered': 3,
        '2.available': 3,
        '2.ordered': 0,
        '3.available': 5,
        '3.ordered': 0,
      });

      expect(client.spreadsheets.values.update.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.update.lastCall.args[0].spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.update.lastCall.args[0].range).toEqual(
        'Orders!D7',
      );
      expect(
        client.spreadsheets.values.update.lastCall.args[0].requestBody,
      ).toEqual({ values: [[0]] });
    });

    test('works if the order consumes all remaining availability', async function () {
      client.setOrders(
        [7, 3, 6],
        ['uid1', 4, 0, 1],
        ['ashley@friskygirlfarm.com', 3, 0, 0],
      );

      let ret = await sheet.setOrdered('ashley@friskygirlfarm.com', 3, 5);
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.available': 3,
        '1.ordered': 3,
        '2.available': 3,
        '2.ordered': 0,
        '3.available': 5,
        '3.ordered': 5,
      });

      expect(client.spreadsheets.values.update.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.update.lastCall.args[0].spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.update.lastCall.args[0].range).toEqual(
        'Orders!D7',
      );
      expect(
        client.spreadsheets.values.update.lastCall.args[0].requestBody,
      ).toEqual({ values: [[5]] });
    });

    test('accounts for the current ordered quantity when checking availability', async function () {
      client.setOrders(
        [7, 3, 6],
        ['uid1', 4, 0, 1],
        ['ashley@friskygirlfarm.com', 3, 0, 3],
      );

      let ret = await sheet.setOrdered('ashley@friskygirlfarm.com', 3, 4);
      expect(Object.fromEntries(ret.entries())).to.deep.nested.include({
        '1.available': 3,
        '1.ordered': 3,
        '2.available': 3,
        '2.ordered': 0,
        '3.available': 5,
        '3.ordered': 4,
      });

      expect(client.spreadsheets.values.update.callCount).toEqual(1);
      expect(
        client.spreadsheets.values.update.lastCall.args[0].spreadsheetId,
      ).toEqual('ssid');
      expect(client.spreadsheets.values.update.lastCall.args[0].range).toEqual(
        'Orders!D7',
      );
      expect(
        client.spreadsheets.values.update.lastCall.args[0].requestBody,
      ).toEqual({ values: [[4]] });
    });

    test('fails on a negative quantity or unknown product', async function () {
      client.setOrders(
        [7, 3, 5],
        ['uid1', 4, 0, 1],
        ['ashley@friskygirlfarm.com', 3, 0, 0],
      );

      await expect(
        sheet.setOrdered('ashley@friskygirlfarm.com', 3, -2),
      ).rejects.toThrow(NegativeQuantityError);
      await expect(
        sheet.setOrdered('ashley@friskygirlfarm.com', 7, 3),
      ).rejects.toThrow(ProductNotFoundError);
      expect(client.spreadsheets.values.update.callCount).toEqual(0);
    });

    test('fails if the product is disabled', async function () {
      client.setOrders(
        [7, 3, 0],
        ['uid1', 4, 0, 0],
        ['ashley@friskygirlfarm.com', 3, 0, 0],
      );

      await expect(
        sheet.setOrdered('ashley@friskygirlfarm.com', 3, 1),
      ).rejects.toThrow(ProductNotFoundError);
      expect(client.spreadsheets.values.update.callCount).toEqual(0);
    });

    test('fails if the order exceeds the availability', async function () {
      client.setOrders(
        [7, 3, 6],
        ['uid1', 4, 0, 2],
        ['ashley@friskygirlfarm.com', 3, 0, 3],
      );

      let error;
      try {
        await sheet.setOrdered('ashley@friskygirlfarm.com', 3, 5);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(QuantityNotAvailableError);
      expect(error).to.have.nested.property('extra.available', 4);
      expect(client.spreadsheets.values.update.callCount).toEqual(0);
    });

    test('fails if there is no orders sheet', async function () {
      client.setNoOrders();
      await expect(
        sheet.setOrdered('ashley@friskygirlfarm.com', 3, 3),
      ).rejects.toThrow(OrdersNotOpenError);
    });
  });

  test('getUsersWithOrders', async function () {
    client.setOrders(
      [1, 0, 1],
      ['hasorder@friskygirlfarm.com', 0, 0, 1],
      ['hasnoorder@friskygirlfarm.com', 0, 0, 0],
      ['alsohasorder@friskygirlfarm.com', 1, 0, 1],
    );

    let ret = await sheet.getUsersWithOrders();
    expect(ret).to.deep.equal([
      'hasorder@friskygirlfarm.com',
      'alsohasorder@friskygirlfarm.com',
    ]);
  });

  test('past orders sheet', async function () {
    sheet = new OrdersSheet(client.asSheets(), 'ssid', 'Orders 6-25');

    client.setOrdersForSheet(
      'Orders 6-25',
      [1, 0, 1],
      ['hasorder@friskygirlfarm.com', 0, 0, 1],
      ['hasnoorder@friskygirlfarm.com', 0, 0, 0],
      ['alsohasorder@friskygirlfarm.com', 1, 0, 1],
    );

    let ret = await sheet.getUsersWithOrders();
    expect(ret).to.deep.equal([
      'hasorder@friskygirlfarm.com',
      'alsohasorder@friskygirlfarm.com',
    ]);
  });
});
