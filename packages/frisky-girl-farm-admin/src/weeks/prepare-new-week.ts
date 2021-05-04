/**
 * Card action handler function to prepare a new week of orders -- copies the
 * "Orders Template" sheet to a new sheet named "Orders (pending)"
 */
function prepareNewWeek() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  let existing = spreadsheet.getSheetByName('Orders (pending)');
  if (existing) {
    existing.activate();
    return createNotificationResponse(
      'You already have a pending week -- see "Orders (pending)" sheet'
    );
  }

  let templateSheet = spreadsheet.getSheetByName('Orders Template');
  templateSheet!.activate();
  let orderSheet = spreadsheet.duplicateActiveSheet();
  orderSheet.setName('Orders (pending)');
  orderSheet.addDeveloperMetadata('orderSheet', new Date().toISOString());

  return createNotificationResponse(
    'New week created. Set product availability in "Orders (pending)" sheet and then open orders when ready.'
  );
}
