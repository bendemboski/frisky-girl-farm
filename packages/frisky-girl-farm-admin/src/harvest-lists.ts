/**
 * Card action handler function to generate the harvest lists (as new sheets)
 * based off of the active orders sheet
 */
function generateHarvestLists() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let orderSheet = spreadsheet.getActiveSheet();
  if (!isOrderSheet(orderSheet)) {
    return createNotificationResponse(
      'This sheet is not an orders sheet. Please navigate to the orders sheet for which you want to generate a harvest list.'
    );
  }

  let groups = groupLocationsByHarvestDay();
  for (let [day, locations] of Object.entries(groups)) {
    generateOneHarvestList(orderSheet, day, locations);
  }
  return;
}

/**
 * Helper to generate a harvest list for a single day/group of locations
 *
 * @param orderSheet the order spreadsheet we're using to generate a harvest list
 * @param day the day of the week
 * @param locations a list of locations whose pickup is on the given day
 */
function generateOneHarvestList(
  orderSheet: GoogleAppsScript.Spreadsheet.Sheet,
  day: string,
  locations: string[]
) {
  let { products, users } = getUserOrders(orderSheet, locations);
  if (products.length === 0) {
    return;
  }

  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let ui = SpreadsheetApp.getUi();

  let newSheet;
  while (!newSheet) {
    let result = ui.prompt(
      `Name for the ${day} harvest list (or press cancel to skip):`,
      ui.ButtonSet.OK_CANCEL
    );
    if (result.getSelectedButton() != ui.Button.OK) {
      return;
    }

    let text = result.getResponseText();
    if (!text) {
      ui.alert(
        'You have to enter the name of a new sheet to generate the harvest list.'
      );
      continue;
    }

    if (spreadsheet.getSheetByName(text)) {
      ui.alert('A sheet with that name already exists.');
      continue;
    }

    newSheet = spreadsheet.insertSheet(text);
  }

  // Harvest list
  let harvestListRange = newSheet.getRange(1, 1, products.length, 2);
  harvestListRange.setValues(products);
  newSheet.autoResizeColumns(1, 1);

  // Packing slips
  let packingSlips = users
    .map(({ name, location, quantities }) => {
      let lines = [`${name} (${location})`];
      Object.entries(quantities).forEach(([productName, quantity]) => {
        lines.push(`${quantity} ${productName}`);
      });
      return lines.join('\n');
    })
    .join('\n\n');

  newSheet.getRange(products.length + 3, 1).setValue(packingSlips);

  // Prune out unused columns and rows so they don't count towards the
  // spreadsheet's max cell limit
  let firstBlankColumn = newSheet.getLastColumn() + 1;
  newSheet.deleteColumns(
    firstBlankColumn,
    newSheet.getMaxColumns() - firstBlankColumn + 1
  );

  let firstBlankRow = newSheet.getLastRow() + 1;
  newSheet.deleteRows(firstBlankRow, newSheet.getMaxRows() - firstBlankRow + 1);
}
