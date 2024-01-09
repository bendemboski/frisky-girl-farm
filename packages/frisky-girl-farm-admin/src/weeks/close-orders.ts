/**
 * Card action handler function to close the current week's orders. Renames the
 * "Orders" shee to "Orders <mm-dd>" and adds a column to the Users sheet
 * tracking what the users spent on this order
 */
function closeOrders() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let orderSheet = spreadsheet.getSheetByName('Orders');
  if (!orderSheet) {
    return createNotificationResponse(
      'There is no "Orders" sheet to close out.',
    );
  }

  let now = new Date();
  let newName = `Orders ${now.getMonth() + 1}-${now.getDate()}`;

  if (spreadsheet.getSheetByName(newName)) {
    return createNotificationResponse(
      `A sheet named "${newName}'" already exists. Please rename it and try again.`,
    );
  }

  // Build a hash mapping emails to their row number in the Users sheet
  let emailToRow: Record<string, number> = {};
  let usersSheet = spreadsheet.getSheetByName('Users');
  let usersValues = usersSheet!.getDataRange().getValues();
  usersValues.slice(1).forEach(function (row, i) {
    // +1 for header row, +1 because row numbers are 1-based
    return (emailToRow[row[0]] = i + 2);
  });

  // Populate an array with `{ row, value }` where each entry represents
  // an amount spent to be filled in for a user. `row` is the row number
  // in the users sheet and `value` is the amount spent to be filled in.
  let usersSpent = [];

  let orderValues = orderSheet.getDataRange().getValues();
  let prices = orderValues[1].slice(1);
  for (let i = 5; i < orderValues.length; i++) {
    let userRow = orderValues[i];
    let email = userRow[0];
    let rowNumber = emailToRow[email];
    if (!rowNumber) {
      return createNotificationResponse(
        `The email address "${email} " was found in the order but not in the Users sheet. Please update it to match a user in the Users sheet or delete the row from the order sheet.`,
      );
    }

    let spent = 0;
    userRow.slice(1).forEach(function (quantity, i) {
      if (quantity) {
        spent += quantity * prices[i];
      }
    });
    if (spent) {
      usersSpent.push({ row: rowNumber, value: spent });
    }
  }

  // Rename the orders sheet
  orderSheet.setName(newName);

  // Fill in the amounts spent
  let newColumnNumber = usersValues[0].length + 1;
  usersSheet!.getRange(1, newColumnNumber).setValue(now);
  usersSpent.forEach(function (toSet) {
    usersSheet!.getRange(toSet.row, newColumnNumber).setValue(toSet.value);
  });
  usersSheet!.autoResizeColumn(newColumnNumber);

  return createNotificationResponse('Orders closed!');
}
