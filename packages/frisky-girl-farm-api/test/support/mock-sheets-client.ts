import sinon from 'sinon';
import type { SinonStub } from 'sinon';
import type { sheets_v4 } from 'googleapis';

export type MockSheet = {
  developerMetadata?: Array<{ metadataKey: string; metadataValue?: string }>;
  properties?: Record<string, unknown>;
  values?: string[];
};

type MockSheets = Record<number, MockSheet>;

type UserData = [string, string, string, ...Array<number | string>];

interface SpreadsheetsStubs {
  values: {
    get: SinonStub<
      [sheets_v4.Params$Resource$Spreadsheets$Values$Get],
      ReturnType<sheets_v4.Sheets['spreadsheets']['values']['get']>
    >;
    append: SinonStub<
      [sheets_v4.Params$Resource$Spreadsheets$Values$Append],
      ReturnType<sheets_v4.Sheets['spreadsheets']['values']['append']>
    >;
    update: SinonStub<
      [sheets_v4.Params$Resource$Spreadsheets$Values$Update],
      ReturnType<sheets_v4.Sheets['spreadsheets']['values']['update']>
    >;
    batchGetByDataFilter: SinonStub<
      [sheets_v4.Params$Resource$Spreadsheets$Values$Batchgetbydatafilter],
      ReturnType<
        sheets_v4.Sheets['spreadsheets']['values']['batchGetByDataFilter']
      >
    >;
  };
  getByDataFilter: SinonStub<
    [sheets_v4.Params$Resource$Spreadsheets$Getbydatafilter],
    ReturnType<sheets_v4.Sheets['spreadsheets']['getByDataFilter']>
  >;
}

export default class MockSheetsClient {
  /**
   * Type helper to cast this to a google sheets API instance
   */
  asSheets() {
    return this as unknown as sheets_v4.Sheets;
  }

  readonly spreadsheets: SpreadsheetsStubs = {
    values: {
      get: sinon.stub(),
      append: sinon.stub(),
      update: sinon.stub(),
      batchGetByDataFilter: sinon.stub(),
    },
    getByDataFilter: sinon.stub(),
  };

  setUsers(extraUsers: ReadonlyArray<UserData> = []) {
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

  setOrdersForSheet(
    sheetName: string | undefined,
    totals: ReadonlyArray<number | ''>,
    ...users: ReadonlyArray<[string, ...Array<number | ''>]>
  ) {
    let ordered = [0, 0, 0];
    users.forEach((orders) => {
      ordered[0] += typeof orders[1] === 'number' ? orders[1] : 0;
      ordered[1] += typeof orders[2] === 'number' ? orders[2] : 0;
      ordered[2] += typeof orders[3] === 'number' ? orders[3] : 0;
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

  setOrders(
    totals: ReadonlyArray<number | ''>,
    ...users: ReadonlyArray<[string, ...Array<number | ''>]>
  ) {
    this.setOrdersForSheet(undefined, totals, ...users);
  }

  resetOrders() {
    this._stubGetOrders().resetBehavior();
  }

  setSheetsFilterQuery(sheets: MockSheets) {
    this.spreadsheets.getByDataFilter.resolves({
      data: {
        sheets: Object.entries(sheets).map(
          ([sheetId, { developerMetadata, properties }]) => {
            return {
              developerMetadata,
              properties: { ...properties, sheetId: parseInt(sheetId, 10) },
            };
          },
        ),
      },
    });
  }

  setValuesFilterQuery(sheets: MockSheets) {
    this.spreadsheets.values.batchGetByDataFilter.resolves({
      data: {
        valueRanges: Object.entries(sheets).map(([sheetId, { values }]) => {
          return {
            valueRange: { values: [values] },
            dataFilters: [{ gridRange: { sheetId: parseInt(sheetId, 10) } }],
          };
        }),
      },
    });
  }

  setSheetsAndValuesFilterQuery(sheets: MockSheets) {
    this.setSheetsFilterQuery(sheets);
    this.setValuesFilterQuery(sheets);
  }

  setPastOrders(
    sheetName: string,
    totals: [number | '', number | '', number | ''],
    ...users: [string, number | '', number | '', number | ''][]
  ) {
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
        }),
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

  private _stubGetOrders({
    sheetName = 'Orders',
    majorDimension = 'COLUMNS',
  } = {}) {
    this.spreadsheets.values.get = this.spreadsheets.values.get || sinon.stub();

    return this.spreadsheets.values.get.withArgs({
      spreadsheetId: 'ssid',
      range: sheetName,
      majorDimension,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
  }
}
