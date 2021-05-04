const buildApp = require('../src/build-app');
const createSpreadsheet = require('./create-spreadsheet');
const AWS = require('aws-sdk');
const { readFileSync } = require('fs');
const YAML = require('yaml');

let [, , stage = 'staging'] = process.argv;

console.log(`Running against stage: ${stage}`); // eslint-disable-line no-console

const serverlessConfig = YAML.parse(readFileSync('serverless.yml').toString());

process.env.AWS_REGION = serverlessConfig.provider.region;

let app = buildApp(
  () => createSpreadsheet(stage),
  () => AWS
);
app.listen(3000);
