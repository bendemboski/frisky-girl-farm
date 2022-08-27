import './support/setup';
import { expect } from 'chai';
import sinon from 'sinon';
import LocationsSheet from '../src/sheets/locations-sheet';
import MockSheetsClient from './support/mock-sheets-client';

describe('LocationsSheet', function () {
  let client: MockSheetsClient;
  let sheet: LocationsSheet;

  beforeEach(function () {
    client = new MockSheetsClient();
    client.setLocations();

    sheet = new LocationsSheet(client.asSheets(), 'ssid');
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
