const sinon = require('sinon');

class MockSheetsClient {
  constructor() {
    this.spreadsheets = { values: {} };
  }

  setUsers(extraUsers = []) {
    this.spreadsheets.values.get = this.spreadsheets.values.get || sinon.stub();

    this.spreadsheets.values.get
      .withArgs({
        spreadsheetId: 'ssid',
        range: 'Users',
        majorDimension: 'ROWS',
        valueRenderOption: 'UNFORMATTED_VALUE',
      })
      .resolves({
        data: {
          values: [
            [
              'email',
              'name',
              'location',
              'balance',
              'starting balance',
              'spent',
            ],
            [
              'ellen@friskygirlfarm.com',
              'Ellen Scheffer',
              'Lake City',
              25.0,
              100.0,
              75.0,
            ],
            [
              'ashley@friskygirlfarm.com',
              'Ashley Wilson',
              'Wallingford',
              45.0,
              100.0,
              55.0,
            ],
            ...extraUsers,
          ],
        },
      });
  }

  setLocations() {
    this.spreadsheets.values.get = this.spreadsheets.values.get || sinon.stub();

    this.spreadsheets.values.get
      .withArgs({
        spreadsheetId: 'ssid',
        range: 'Locations',
        majorDimension: 'ROWS',
        valueRenderOption: 'UNFORMATTED_VALUE',
      })
      .resolves({
        data: {
          values: [
            ['Name', 'Pickup day', 'Harvest day', 'Email instructions'],
            [
              'Wallingford',
              'Saturday',
              'Friday',
              'Come for the veggies, stay for the neighborhood character',
            ],
            ['Lake City', 'Tuesday', 'Monday', 'Like a city, but also a lake'],
          ],
        },
      });
  }

  setNoOrders() {
    this._stubGetOrders().rejects({ code: 400 });
  }

  setOrders(...args) {
    let sheetName;
    let totals;
    let users;
    if (typeof args[0] === 'string') {
      [sheetName, totals, ...users] = args;
    } else {
      [totals, ...users] = args;
    }

    let ordered = [0, 0, 0];
    users.forEach((orders) => {
      ordered[0] += orders[1] || 0;
      ordered[1] += orders[2] || 0;
      ordered[2] += orders[3] || 0;
    });

    this._stubGetOrders().resolves({
      data: {
        values: [
          ['', 'price', 'image', 'total', 'ordered', ...users.map((u) => u[0])],
          [
            'Lettuce',
            0.15,
            'http://lettuce.com/image.jpg',
            totals[0],
            ordered[0],
            ...users.map((u) => u[1]),
          ],
          [
            'Kale',
            0.85,
            'http://kale.com/image.jpg',
            totals[1],
            ordered[1],
            ...users.map((u) => u[2]),
          ],
          [
            'Spicy Greens',
            15.0,
            'http://spicy-greens.com/image.jpg',
            totals[2],
            ordered[2],
            ...users.map((u) => u[3]),
          ],
        ],
      },
    });

    this._stubGetOrders({ sheetName, majorDimension: 'ROWS' }).resolves({
      data: {
        values: [
          ['', 'Lettuce', 'Kale', 'Spicy Greens'],
          ['price', 0.15, 0.85, 15.0],
          [
            'image',
            'http://lettuce.com/image.jpg',
            'http://kale.com/image.jpg',
            'http://spicy-greens.com/image.jpg',
          ],
          ['total', ...totals],
          ['ordered', ...ordered],
          ...users,
        ],
      },
    });
  }

  resetOrders(sheetName) {
    this._stubGetOrders(sheetName).resetBehavior();
  }

  setSheetsFilterQuery(sheets) {
    this.spreadsheets.getByDataFilter =
      this.spreadsheets.getByDataFilter || sinon.stub();

    this.spreadsheets.getByDataFilter.resolves({
      data: {
        sheets: Object.entries(sheets).map(
          ([sheetId, { developerMetadata, properties }]) => {
            return {
              developerMetadata,
              properties: { ...properties, sheetId },
            };
          }
        ),
      },
    });
  }

  setValuesFilterQuery(sheets) {
    this.spreadsheets.values.batchGetByDataFilter =
      this.spreadsheets.values.batchGetByDataFilter || sinon.stub();

    this.spreadsheets.values.batchGetByDataFilter.resolves({
      data: {
        valueRanges: Object.entries(sheets).map(([sheetId, { values }]) => {
          return {
            valueRange: { values: [values] },
            dataFilters: [{ gridRange: { sheetId } }],
          };
        }),
      },
    });
  }

  setSheetsAndValuesFilterQuery(sheets) {
    this.setSheetsFilterQuery(sheets);
    this.setValuesFilterQuery(sheets);
  }

  setPastOrders(sheetName, totals, ...users) {
    let ordered = [0, 0, 0];
    users.forEach((orders) => {
      ordered[0] += orders[1] || 0;
      ordered[1] += orders[2] || 0;
      ordered[2] += orders[3] || 0;
    });

    this._stubGetOrders({ sheetName }).resolves({
      data: {
        values: [
          ['', 'price', 'image', 'total', 'ordered', ...users.map((u) => u[0])],
          [
            'Lettuce',
            0.15,
            'http://lettuce.com/image.jpg',
            totals[0],
            ordered[0],
            ...users.map((u) => u[1]),
          ],
          [
            'Kale',
            0.85,
            'http://kale.com/image.jpg',
            totals[1],
            ordered[1],
            ...users.map((u) => u[2]),
          ],
          [
            'Spicy Greens',
            15.0,
            'http://spicy-greens.com/image.jpg',
            totals[2],
            ordered[2],
            ...users.map((u) => u[3]),
          ],
        ],
      },
    });
  }

  stubAppendOrder() {
    this.spreadsheets.values.append =
      this.spreadsheets.values.append || sinon.stub();
    this.spreadsheets.values.append
      .withArgs(
        sinon.match({
          spreadsheetId: 'ssid',
          range: 'Orders!A6',
        })
      )
      .resolves({ data: { updates: { updatedRange: 'Orders!A8:D8' } } });
  }

  stubUpdateOrder() {
    this.spreadsheets.values.update =
      this.spreadsheets.values.update || sinon.stub();
    this.spreadsheets.values.update
      .withArgs(sinon.match({ range: 'Orders!' }))
      .resolves();
  }

  _stubGetOrders({ sheetName = 'Orders', majorDimension = 'COLUMNS' } = {}) {
    this.spreadsheets.values.get = this.spreadsheets.values.get || sinon.stub();

    return this.spreadsheets.values.get.withArgs({
      spreadsheetId: 'ssid',
      range: sheetName,
      majorDimension,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
  }
}

module.exports = MockSheetsClient;
