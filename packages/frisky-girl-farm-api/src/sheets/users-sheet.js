const Sheet = require('./sheet');
const { UnknownUserError } = require('./errors');

const sheetName = 'Users';
const emailColumnIndex = 0;
const nameColumnIndex = 1;
const locationColumnIndex = 2;
const balanceColumnIndex = 3;

class UsersSheet extends Sheet {
  constructor({ client, spreadsheetId }) {
    super({ client, spreadsheetId, sheetName });
  }

  // Get a user object by id (email). User objects look like
  //
  // {
  //   email.
  //   name,
  //   location,
  //   balance
  // }
  async getUser(userId) {
    let users = await this.getUsers([userId]);
    if (users.length === 0) {
      throw new UnknownUserError();
    }

    return users[0];
  }

  // Get an array of user objects for the given ids (emails). Any that aren't
  // found will be omitted.
  async getUsers(userIds) {
    // Make sure whitespace doesn't mess us up
    userIds = userIds.map((id) => id.trim());

    let [, ...userRows] = await this.getAll({ majorDimension: 'ROWS' });
    let users = [];
    for (let row of userRows) {
      if (!row[emailColumnIndex]) {
        continue;
      }

      if (userIds.includes(row[emailColumnIndex].trim())) {
        users.push({
          // Tolerate accidental whitespace, and trim it out when generating the email
          // of the actual user object.
          email: row[emailColumnIndex].trim(),
          name: row[nameColumnIndex],
          location: row[locationColumnIndex],
          balance: row[balanceColumnIndex],
        });
      }
    }
    return users;
  }
}

module.exports = UsersSheet;
