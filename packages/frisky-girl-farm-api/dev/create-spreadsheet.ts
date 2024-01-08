import { readFileSync } from 'fs';
import path from 'path';

import createClient from '../src/sheets/create-client';
import Spreadsheet from '../src/sheets/spreadsheet';

export default function createSpreadsheet(stage = 'prod') {
  let { spreadsheet_id: spreadsheetId } = JSON.parse(
    readFileSync(path.join(__dirname, '..', `config.${stage}.json`)).toString()
  );

  return new Spreadsheet(
    spreadsheetId,
    createClient(path.join(__dirname, '..', `config.${stage}.json`))
  );
}
