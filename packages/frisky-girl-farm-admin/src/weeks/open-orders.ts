/**
 * Card action handler function to open orders for a prepared week. Renames the
 * "Orders (pending)" sheet to "Orders" and hides columns containing products
 * with not availability.
 */
function openOrders() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Orders (pending)');
  if (!sheet) {
    return createNotificationResponse(
      'There is no "Orders (pending)" sheet. You need to prepare a week before you can open orders.'
    );
  }
  if (spreadsheet.getSheetByName('Orders')) {
    return createNotificationResponse(
      'There is already an "Orders" sheet. You need to close orders for that week before opening a new week.'
    );
  }

  sheet.setName('Orders');

  // Hide all columns with no availability. Hiding them one at a time is
  // really slow, so build up a list of { start, length } describing ranges
  // of columns to hide.
  let rangesToHide: Array<{ start: number; length: number }> = [];
  let lastHiddenIndex: number;
  let totals = sheet.getDataRange().getValues()[3];
  totals.slice(1).forEach(function (total, i) {
    if (total) {
      return;
    }

    // +1 because column numbers are 1-based, and +1 to skip label column
    let columnIndex = i + 2;
    if (columnIndex - 1 === lastHiddenIndex) {
      rangesToHide[rangesToHide.length - 1].length += 1;
    } else {
      rangesToHide.push({ start: columnIndex, length: 1 });
    }

    lastHiddenIndex = columnIndex;
  });

  for (let range of rangesToHide) {
    sheet.hideColumns(range.start, range.length);
  }

  return createNotificationResponse('Orders opened!');
}
