import { google } from 'googleapis';

const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

// Create an authenticated Google sheets API client
export default function createClient(configPath: string) {
  let auth = new google.auth.GoogleAuth({
    keyFile: configPath,
    scopes,
  });

  return google.sheets({
    auth,
    version: 'v4',
  });
}
