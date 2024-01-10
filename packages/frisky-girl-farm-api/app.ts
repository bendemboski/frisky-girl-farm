import sls from 'serverless-http';
import createClient from './src/sheets/create-client';
import Spreadsheet from './src/sheets/spreadsheet';
import { SES } from '@aws-sdk/client-ses';
import buildApp from './src/build-app';
import os from 'os';
import path from 'path';
import { writeFileSync } from 'fs';

module.exports = {
  server: sls(
    buildApp(
      () => {
        let keyPath = path.join(os.tmpdir(), 'config.json');
        writeFileSync(keyPath, process.env.GOOGLE_CONFIG!);
        return new Spreadsheet(
          process.env.GOOGLE_SPREADSHEET_ID!,
          createClient(keyPath),
        );
      },
      () => ({ ses: new SES() }),
    ),
  ),
};
