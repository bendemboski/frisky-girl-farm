import type { sheets_v4 } from 'googleapis';

//
// Base class representing a sheet within a spreadsheet
//
export default class Sheet {
  constructor(
    private readonly client: sheets_v4.Sheets,
    private readonly spreadsheetId: string,
    protected readonly sheetName: string,
  ) {}

  async getAll({
    majorDimension,
  }: { majorDimension?: 'ROWS' | 'COLUMNS' } = {}) {
    let {
      data: { values },
    } = await this._values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.sheetName,
      majorDimension,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return values!;
  }

  async append(range: string, values: Array<string | number>) {
    let result = await this._values.append({
      spreadsheetId: this.spreadsheetId,
      range: this._range(range),
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    return result.data.updates!.updatedRange!.split('!')[1];
  }

  async update(
    range: string,
    values: Array<Array<string | number>>,
    { majorDimension }: { majorDimension?: 'ROWS' | 'COLUMNS' } = {},
  ) {
    await this._values.update({
      spreadsheetId: this.spreadsheetId,
      range: this._range(range),
      valueInputOption: 'RAW',
      requestBody: majorDimension ? { values, majorDimension } : { values },
    });
  }

  async clear(range: string) {
    await this._values.clear({
      spreadsheetId: this.spreadsheetId,
      range: this._range(range),
    });
  }

  private get _values() {
    return this.client.spreadsheets.values;
  }

  private _range(range: string) {
    return `${this.sheetName}!${range}`;
  }
}
