# Frisky Girl Farm API

API server for Frisky Girl Farm CSA website

## Overview

This project implements the API server, which is an Express app that uses a Google Sheets spreadsheet as its backend storage. It's set up to run in AWS Lambda and to deploy via Serverless, but should be runnable in any deplyment environment that supports Node.js.

## Spreadsheet format

The API server looks for several sheets in the spreadsheet, identified by name. Any other sheets will be ignored. A minimal template spreadsheet can be found [here](https://docs.google.com/spreadsheets/d/1gdw6m-eWT3OZ2dzEztGnws8m76nI2yKwSddvowNlQCs/edit#gid=1406465942).

### Locations

There must be a sheet named `Locations` laid out like this:

|   | A      | B            | C             | D
| 1 | name   | Pickup day   | Harvest day   | Pickup instructions
| 2 | (name) | (pickup day) | (harvest day) | (pickup instructions)
| 3 | (name) | (pickup day) | (harvest day) | (pickup instructions)
| 4 | (name) | (pickup day) | (harvest day) | (pickup instructions)

* `name` (string) the name of the location (must be unique)
* `pickup day` the day of the week that users pick up from this location
* `harvest day` the day of the week that the farmers harvest for this location
* `pickup instruction` instructions for pickup which are included in the order confirmation emails for users picking up at this location

### Users

There must be a sheet named `Users` laid out like this:

|   | A       | B      | C          | D       | E       | F                  | G
| 1 | email   | name   | location   | phone   | balance | starting balance   | spent
| 2 | (email) | (name) | (location) | (phone) | =F2-G2  | (starting balance) | (spent)
| 3 | (email) | (name) | (location) | (phone) | =F3-G3  | (starting balance) | (spent)
| 4 | (email) | (name) | (location) | (phone) | =F4-G4  | (starting balance) | (spent)

* `email` (string) The user's email
* `name` (string) The user's name
* `location` (string) The location where the user is picking up their order
* `phone` (string) The user's phone number (not currently used by the system, just a convenience for the farmers)
* `starting balance` (currency) The user's starting balance for the season
* `spent` (currency) The amount the user has already spent, not including the current order (if any)

Rows `2` - `4` (and beyond) are filled in dynamically by the API.

### Orders

The API server looks for a sheet named `Orders`. When this sheet is present, it will be used to track orders for a currently open order period. When not present, orders are not tracked/allowed. The `Orders` sheet is laid out like this:

|   | A         | B              | C              | D              |
|---|-----------|----------------|----------------|----------------|
| 1 |           | (product name) | (product name) | (product name) |
| 2 | price     | (price)        | (price)        | (price)        |
| 3 | image     | (image URL)    | (image URL)    | (image URL)    |
| 4 | total     | (total)        | (total)        | (total)        |
| 5 | ordered   | =sum(B6:B)     | =sum(C6:C)     | =sum(D6:D)     |
| 6 | (user id) | (ordered)      | (ordered)      | (ordered)      |
| 7 | (user id) | (ordered)      | (ordered)      | (ordered)      |
| 8 | (user id) | (ordered)      | (ordered)      | (ordered)      |

* `product name` (string) the product's name
* `price` (currency) the product's price
* `image URL` (string) the URL of an image of the product
* `total` (number) the total quantity of the product that is available (0 to disable the product or -1 to not have a limit)
* `user id` (string) the id of a user
* `ordered` (number) a user's quantity of a product ordered

The user order rows (`7` - `9` and beyond) are filled in dynamically by the API server.

Since sheets with names not specified here are ignored, the sheet for an order period can be prepared under a different name, and then renamed to `Orders` to open up ordering for that period. Then when the period is closed, the sheet can be renamed to anything to close ordering. Closed orders sheets need to be kept around in the spreadsheet so the website can use them to show users their order history -- developer metadata is used to identify past order sheets and what dates they represent, so the names of these sheets is not important.

## Email setup

The API server is used to send confirmation emails to users via AWS SES. Currently, the sending email address is hard-coded to be, so the AWS account must have `friskygirlfarm@gmail.com` as a verified email address, and production access enabled for the SES account (moved out of the sandbox).

## Build credentials

### AWS

Deployments make use of the AWS SDK for Node.js, so it must have access to credentials with permissions to deploy a Serverless AWS Node.js project, either in the environment or `~/.aws/credentials`. The GitHub action that does these deployments expects `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables for a user with with write access to the S3 bucket to be configured in the environment via GitHub repository/environment secrets.

For deploying manually, refer to the `serverless` documentation. You will need to AWS credentials configured for a user with permission to perform serverless deployments, which can be done via environment variables or a `~/.aws/credentials` file. This package has `dotenv-cli` installed and scripts in `package.json` that use it to invoke deployment comments, so you can set environment variables like your credentials or `AWS_PROFILE` in a `.env` file in this directory.

### Google Sheets

This project uses a Google Sheets spreadsheet as its backend storage, so it needs the id of the spreadsheet to use and the email and private key of a Google API user with write access to the spreadsheet. Each stage (e.g. `stage`, `prod`) can have its own user and spreadsheet, so this info is configured in `config.<stage>.json`. This is a JSON file with the following format:

```json
{
  "privateKey": "<Google API user's private key>",
  "email": "<Google API user's email>",
  "spreadsheetId": "<id of Google Sheets spreadsheet>"
}
```

When GitHub actions deploys a successful a `main` build it deploys it to the `prod` stage, so the `GOOGLE_SHEETS_CONFIG` repository secret contains the `prod` deployment info (base64-encoded).
