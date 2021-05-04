const Sheet = require('./sheet');

const sheetName = 'Locations';
const nameColumnIndex = 0;
const pickupInstructionsColumnIndex = 3;

class LocationsSheet extends Sheet {
  constructor({ client, spreadsheetId }) {
    super({ client, spreadsheetId, sheetName });
  }

  async getLocations() {
    let [, ...rows] = await this.getAll({ majorDimension: 'ROWS' });
    let locations = [];
    for (let row of rows) {
      if (row[nameColumnIndex]) {
        locations.push({
          name: row[nameColumnIndex],
          pickupInstructions: row[pickupInstructionsColumnIndex],
        });
      }
    }
    return locations;
  }
}

module.exports = LocationsSheet;
