/**
 * Product counts (quantity ordered per user, quantity available, etc.)
 */
type ProductCounts = Record<string, number>;

/**
 * A user's info -- name and location
 */
interface UserInfo {
  name: string;
  location: string;
}

/**
 * A user's order info -- location and counts of products ordered
 */
interface UserOrderInfo extends UserInfo {
  email: string;
  name: string;
  location: string;
  quantities: ProductCounts;
}

/**
 * An array of product name and number ordered, provided as an array so it's
 * suitable to pass to the sheets API's Range.setValues()
 */
type HarvestQuantities = [string, number];

//
// Gets user order information from an orders sheet for users picking up
// at any of the specified locations.
//
// Returns `{ products, users }`
//
// `products` is
//
// [
//   [ <productName>, <totalToHarvest> ],
//   [ <productName>, <totalToHarvest> ],
//   ...
// ]
//
// where each `productName`/`totalToHarvest` pair describes the of a
// product to harvest for the specified locations, omitting products
// with 0 units to harvest.
//
// `users` is
//
// [
//   {
//     email: <userEmail>,
//     name: <userName>,
//     location: <userLocation>,
//       quantities: {
//         <productName>: <quantityOrdered>,
//         <productName>: <quantityOrdered>,
//         ...
//       }
//     }
//   },
//   {
//     email: <userEmail>,
//     name: <userName>,
//     location: <userLocation>,
//       quantities: {
//         <productName>: <quantityOrdered>,
//         <productName>: <quantityOrdered>,
//         ...
//       }
//     }
//   },
//   ...
// }
//
// where each user picking up in any of the specified locations that has
// ordered anything is represented with their location and a hash describing
// all the products they ordered with quantities.
//
function getUserOrders(
  orderSheet: GoogleAppsScript.Spreadsheet.Sheet,
  locations: string[],
) {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Build a map from email to `{ name, location }` for only users picking up
  // at one of the specified locations
  let userInfo: Record<string, UserInfo> = {};
  spreadsheet
    .getSheetByName('Users')!
    .getDataRange()
    .getValues()
    .slice(1)
    .forEach(function (row) {
      let email = row[0];
      let name = row[1];
      let location = row[2];

      if (locations.indexOf(location) !== -1) {
        userInfo[email] = { name: name, location: location };
      }
    });

  let productHash: ProductCounts = {};
  let users: UserOrderInfo[] = [];
  let values = orderSheet.getDataRange().getValues();

  // Save off the row with all the product names, removing the first blank cell
  let productNames = values[0].slice(1);
  values.slice(5).forEach(function (row) {
    // The first column is the user id, so check to see if it's in our list
    // of users for this harvest/location
    let email = row[0];
    let info = userInfo[email];
    if (!info) {
      // User not picking up on this day
      return;
    }

    let quantities: Record<string, number> = {};
    row.slice(1).forEach(function (quantity, i) {
      if (quantity) {
        let productName = productNames[i];
        quantities[productName] = quantity;
        // Track that we have some orders for this product
        productHash[productName] = productHash[productName] || 0;
        productHash[productName] += quantity;
      }
    });

    // Make sure the user has ordered something
    if (Object.keys(quantities).length > 0) {
      users.push({
        email,
        name: info.name,
        location: info.location,
        quantities,
      });
    }
  });

  // Order the products by how they appear in the sheet
  let products: HarvestQuantities[] = [];
  productNames.forEach(function (name) {
    if (productHash[name]) {
      products.push([name, productHash[name]]);
    }
  });

  return { products: products, users: users };
}
