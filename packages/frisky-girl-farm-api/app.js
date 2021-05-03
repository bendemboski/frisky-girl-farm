const sls = require('serverless-http');
const createClient = require('./src/sheets/create-client');
const Spreadsheet = require('./src/sheets/spreadsheet');
const AWS = require('aws-sdk');
const buildApp = require('./src/build-app');
const os = require('os');
const path = require('path');
const {
  promises: { writeFile },
} = require('fs');

module.exports = {
  server: sls(
    buildApp(
      async () => {
        let keyPath = path.join(os.tmpdir(), 'config.json');
        await writeFile(keyPath, process.env.GOOGLE_CONFIG);
        return new Spreadsheet({
          id: process.env.GOOGLE_SPREADSHEET_ID,
          client: await createClient(keyPath),
        });
      },
      () => AWS
    )
  ),
};
