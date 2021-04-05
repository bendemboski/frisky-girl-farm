/**
 * Groups locations by their harvest day.
 *
 * Returns a hash whose keys are the harvest day and values are lists of pickup
 * locations for that harvest day.
 */
function groupLocationsByHarvestDay() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let locationsSheet = spreadsheet.getSheetByName('Locations');

  let groups: Record<string, string[]> = {};
  // The first row is headers, so read all the following rows
  locationsSheet!
    .getDataRange()
    .getValues()
    .slice(1)
    .forEach(function (row) {
      let name = row[0];
      let day = row[2];
      groups[day] = groups[day] || [];
      groups[day].push(name);
    });
  return groups;
}
