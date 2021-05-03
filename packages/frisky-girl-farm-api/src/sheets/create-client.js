const { google } = require('googleapis');

const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

// Create an authenticated Google sheets API client
async function createClient(configPath) {
  let auth = new google.auth.GoogleAuth({
    keyFile: configPath,
    scopes,
  });

  return google.sheets({
    auth,
    version: 'v4',
  });
}

module.exports = createClient;
