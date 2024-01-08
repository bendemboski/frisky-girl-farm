import Sheet from './sheet';
import type { sheets_v4 } from 'googleapis';

const sheetName = 'Locations';
const nameColumnIndex = 0;
const pickupInstructionsColumnIndex = 3;

export interface Location {
  name: string;
  pickupInstructions: string;
}

export default class LocationsSheet extends Sheet {
  constructor(client: sheets_v4.Sheets, spreadsheetId: string) {
    super(client, spreadsheetId, sheetName);
  }

  async getLocations(): Promise<Location[]> {
    let [, ...rows] = await this.getAll({ majorDimension: 'ROWS' });
    let locations: Location[] = [];
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
