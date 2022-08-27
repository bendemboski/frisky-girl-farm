import buildApp from '../src/build-app';
import createSpreadsheet from './create-spreadsheet';
import AWS from 'aws-sdk';
import { readFileSync } from 'fs';
import YAML from 'yaml';

let [, , stage = 'staging'] = process.argv;

console.log(`Running against stage: ${stage}`); // eslint-disable-line no-console

const serverlessConfig = YAML.parse(readFileSync('serverless.yml').toString());

process.env.AWS_REGION = serverlessConfig.provider.region;

let app = buildApp(
  () => createSpreadsheet(stage),
  () => AWS
);
app.listen(3000);
