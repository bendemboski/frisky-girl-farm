import './support/setup';
import { expect } from 'chai';
import sinon from 'sinon';
import UsersSheet from '../src/sheets/users-sheet';
import { UnknownUserError } from '../src/sheets/errors';
import MockSheetsClient from './support/mock-sheets-client';

describe('UsersSheet', function () {
  let client: MockSheetsClient;
  let sheet: UsersSheet;

  beforeEach(function () {
    client = new MockSheetsClient();
    client.setUsers([
      [
        ' spacey@friskygirlfarm.com ',
        'Spacey McWhitespace',
        'Wallingford',
        35.0,
        100.0,
        65.0,
      ],
      // Make sure some extra garbage data doesn't mess things up
      ['', '', '', 0, '', ''],
    ]);

    sheet = new UsersSheet(client.asSheets(), 'ssid');
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('getUser', function () {
    it('works', async function () {
      expect(await sheet.getUser('ashley@friskygirlfarm.com')).to.deep.equal({
        email: 'ashley@friskygirlfarm.com',
        name: 'Ashley Wilson',
        location: 'Wallingford',
        balance: 45.0,
      });
    });

    it('matches with extra whitespace', async function () {
      expect(await sheet.getUser(' ashley@friskygirlfarm.com ')).to.deep.equal({
        email: 'ashley@friskygirlfarm.com',
        name: 'Ashley Wilson',
        location: 'Wallingford',
        balance: 45.0,
      });

      expect(await sheet.getUser('spacey@friskygirlfarm.com')).to.deep.equal({
        email: 'spacey@friskygirlfarm.com',
        name: 'Spacey McWhitespace',
        location: 'Wallingford',
        balance: 35.0,
      });

      expect(
        await sheet.getUser(' spacey@friskygirlfarm.com     '),
      ).to.deep.equal({
        email: 'spacey@friskygirlfarm.com',
        name: 'Spacey McWhitespace',
        location: 'Wallingford',
        balance: 35.0,
      });
    });

    it('throws when the user is not found', async function () {
      expect(
        sheet.getUser('becky@friskygirlfarm.com'),
      ).to.eventually.be.rejectedWith(UnknownUserError);
    });
  });

  it('getUsers', async function () {
    expect(
      await sheet.getUsers([
        'spacey@friskygirlfarm.com',
        'ellen@friskygirlfarm.com',
      ]),
    ).to.deep.equal([
      {
        email: 'ellen@friskygirlfarm.com',
        name: 'Ellen Scheffer',
        location: 'Lake City',
        balance: 25.0,
      },
      {
        email: 'spacey@friskygirlfarm.com',
        name: 'Spacey McWhitespace',
        location: 'Wallingford',
        balance: 35.0,
      },
    ]);
  });
});
