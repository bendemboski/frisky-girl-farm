const { readFileSync } = require('fs');
const path = require('path');

const createClient = require('../src/sheets/create-client');
const Spreadsheet = require('../src/sheets/spreadsheet');

async function createSpreadsheet(stage = 'prod') {
  let { spreadsheet_id: spreadsheetId } = JSON.parse(
    readFileSync(path.join(__dirname, '..', `config.${stage}.json`))
  );

  return new Spreadsheet({
    id: spreadsheetId,
    client: await createClient(
      path.join(__dirname, '..', `config.${stage}.json`)
    ),
  });
}

module.exports = createSpreadsheet;
