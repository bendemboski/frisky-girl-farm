import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import asyncHandler from 'express-async-handler';

import { SheetsError, UnknownUserError } from './sheets/errors';
import sendConfirmationEmails from './send-confirmation-emails';

import type Spreadsheet from './sheets/spreadsheet';
import type { ProductOrderMap } from './sheets/orders-sheet';
import type {
  ProductsResponse,
  PastOrdersResponse,
  User,
  PastOrderProductsResponse,
} from './types';

export type AWSFactory = () => typeof import('aws-sdk');

function serializeProducts(products: ProductOrderMap): ProductsResponse {
  return {
    products: Array.from(products.entries()).map(([id, data]) => {
      return { id: `${id}`, ...data };
    }),
  };
}

export default function buildApp(
  spreadsheetFactory: () => Spreadsheet,
  awsFactory: AWSFactory
) {
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
    asyncHandler(async (req, res: Response) => {
      let userId = req.params.id;

      let spreadsheet = spreadsheetFactory();
      try {
        let user: User = await spreadsheet.getUser(userId);
        res.status(200).json(user);
      } catch (e) {
        if (e instanceof UnknownUserError) {
          res.status(404).json({ code: e.code });
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
      let userId = req.query.userId as string;

      let spreadsheet = spreadsheetFactory();
      let products = await spreadsheet.getProducts(userId);
      let response: ProductsResponse = serializeProducts(products);
      res.status(200).json(response);
    })
  );

  //
  // set user's order for a product
  //
  app.put(
    '/products/:id',
    asyncHandler(async (req, res) => {
      let productId = req.params.id;
      let ordered = req.body.ordered;
      let userId = req.query.userId as string;

      let spreadsheet = spreadsheetFactory();

      // Verify that the user exists
      await spreadsheet.getUser(userId);

      if (typeof ordered !== 'number' || ordered < 0) {
        res.status(400).json({
          code: 'badInput',
          message: "Must specify 'ordered' as a non-negative number",
        });
        return;
      }

      let products = await spreadsheet.setProductOrder(
        userId,
        parseInt(productId, 10),
        ordered
      );
      let response: ProductsResponse = serializeProducts(products);
      res.status(200).json(response);
    })
  );

  //
  // get order weeks
  //
  app.get(
    '/orders',
    asyncHandler(async (req, res) => {
      let userId = req.query.userId as string;

      let spreadsheet = spreadsheetFactory();
      let orders = await spreadsheet.getUserOrders(userId);
      let response: PastOrdersResponse = {
        orders: orders
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .map(({ id, date }) => ({ id, date: date.toISOString() })),
      };
      res.status(200).json(response);
    })
  );

  app.get(
    '/orders/:id',
    asyncHandler(async (req, res) => {
      let sheetId = parseInt(req.params.id, 10);
      let userId = req.query.userId as string;

      let spreadsheet = spreadsheetFactory();

      let sheet = await spreadsheet.getOrdersSheet(sheetId);
      if (!sheet) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      let { products } = await sheet.getForUser(userId);
      let response: PastOrderProductsResponse = {
        products: Array.from(products.values()).map(
          ({ name, imageUrl, price, ordered }) => {
            return { name, imageUrl, price, ordered };
          }
        ),
      };
      res.status(200).json(response);
    })
  );

  //
  // send confirmation emails
  //
  app.post(
    '/admin/confirmation-emails',
    asyncHandler(async (req, res) => {
      let sheetId = req.body.sheetId;

      if (!sheetId) {
        res.status(400).json({ error: 'No sheet specified' });
        return;
      }

      if (typeof sheetId !== 'number') {
        res.status(400).json({ error: 'Sheet id must be a number' });
        return;
      }

      // The API endpoint takes a sheet id rather than a name to make it
      // slightly more secure -- names are much easier to guess than ids. So
      // here we fetch the info for the sheet so we can get its name for A1
      // queries, and also verify that it is actually an orders sheet via the
      // developer metadata.
      let spreadsheet = spreadsheetFactory();
      let sheet = await spreadsheet.getOrdersSheet(sheetId);
      if (!sheet) {
        res.status(400).json({ error: 'Orders sheet not found' });
        return;
      }

      // Get the user/location data
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
  app.use(function (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
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
