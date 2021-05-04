const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const asyncHandler = require('express-async-handler');

const { SheetsError, UnknownUserError } = require('./sheets/errors');
const sendConfirmationEmails = require('./send-confirmation-emails');

function serializeProducts(products) {
  return {
    products: Object.keys(products).map((id) => {
      return Object.assign({ id: `${id}` }, products[id]);
    }),
  };
}

function buildApp(spreadsheetFactory, awsFactory) {
  let app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(
    bodyParser.json({
      type: ['application/json'],
    })
  );
  app.use(cors());

  //
  // get current user
  //
  app.get(
    '/users/:id',
    asyncHandler(async (req, res) => {
      let {
        params: { id: userId },
      } = req;

      let spreadsheet = await spreadsheetFactory();
      try {
        let user = await spreadsheet.getUser(userId);
        return res.status(200).json(user);
      } catch (e) {
        if (e instanceof UnknownUserError) {
          return res.status(404).json({ code: e.code });
        }
        throw e;
      }
    })
  );

  //
  // get products
  //
  app.get(
    '/products',
    asyncHandler(async (req, res) => {
      let {
        query: { userId },
      } = req;

      let spreadsheet = await spreadsheetFactory();
      let products = await spreadsheet.getProducts(userId);
      return res.status(200).json(serializeProducts(products));
    })
  );

  //
  // set user's order for a product
  //
  app.put(
    '/products/:id',
    asyncHandler(async (req, res) => {
      let {
        query: { userId },
        params: { id: productId },
        body: { ordered },
      } = req;

      let spreadsheet = await spreadsheetFactory();

      // Verify that the user exists
      await spreadsheet.getUser(userId);

      if (typeof ordered !== 'number' || ordered < 0) {
        return res.status(400).json({
          code: 'badInput',
          message: "Must specify 'ordered' as a non-negative number",
        });
      }

      let products = await spreadsheet.setProductOrder(
        userId,
        parseInt(productId, 10),
        ordered
      );
      return res.status(200).json(serializeProducts(products));
    })
  );

  //
  // send confirmation emails
  //
  app.post(
    '/admin/confirmation-emails',
    asyncHandler(async (req, res) => {
      let {
        body: { sheetId },
      } = req;

      if (!sheetId) {
        return res.status(400).json({ error: 'No sheet specified' });
      }

      // The API endpoint takes a sheet id rather than a name to make it
      // slightly more secure -- names are much easier to guess than ids. So
      // here we fetch the info for the sheet so we can get its name for A1
      // queries, and also verify that it is actually an orders sheet via the
      // developer metadata.
      let spreadsheet = await spreadsheetFactory();
      let {
        data: { sheets },
      } = await spreadsheet.client.spreadsheets.getByDataFilter({
        spreadsheetId: spreadsheet.id,
        resource: {
          dataFilters: [{ gridRange: { sheetId } }],
        },
        fields: 'sheets.properties,sheets.developerMetadata',
      });

      // Make sure it exists
      if (sheets.length === 0) {
        return res.status(400).json({ error: 'Sheet does not exist' });
      }

      // Check developer metadata
      let metadata = sheets[0].developerMetadata || [];
      if (!metadata.find(({ metadataKey }) => metadataKey === 'orderSheet')) {
        return res.status(400).json({ error: 'Sheet is not an order sheet' });
      }

      // Get the user/location data
      let sheet = spreadsheet.getOrdersSheet(sheets[0].properties.title);
      let [users, locations] = await Promise.all([
        (async () => {
          let emails = await sheet.getUsersWithOrders();
          return await spreadsheet.getUsers(emails);
        })(),
        await spreadsheet.getLocations(),
      ]);

      let failedSends = await sendConfirmationEmails(
        awsFactory,
        users,
        locations
      );

      if (failedSends.length > 0) {
        console.error('Failed sends', failedSends.join(' '));
      }

      res.status(200).json({ failedSends });
    })
  );

  // Log errors
  app.use(function (err, req, res, next) {
    if (err instanceof SheetsError) {
      // One of our sheets errors
      let { code, extra } = err;
      res.status(err.statusCode).json({ code, extra });
    } else {
      console.error(err); // eslint-disable-line no-console
      next(err);
    }
  });

  return app;
}

module.exports = buildApp;
