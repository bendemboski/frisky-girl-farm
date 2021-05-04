/**
 * Determines if the given sheet in an order sheet
 */
function isOrderSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
  let dm = sheet.getDeveloperMetadata();
  for (let i = 0; i < dm.length; i++) {
    if (dm[i].getKey() === 'orderSheet') {
      return true;
    }
  }
  return false;
}
