require('./support/setup');
const { expect } = require('chai');
const sinon = require('sinon');
const LocationsSheet = require('../src/sheets/locations-sheet');
const MockSheetsClient = require('./support/mock-sheets-client');

describe('LocationsSheet', function () {
  let client;
  let sheet;

  beforeEach(function () {
    client = new MockSheetsClient();
    client.setLocations();

    sheet = new LocationsSheet({
      client,
      spreadsheetId: 'ssid',
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('getLocations', async function () {
    expect(await sheet.getLocations()).to.deep.equal([
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
});
