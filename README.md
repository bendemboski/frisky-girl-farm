# Frisky Girl Farm CSA Website

![Frisky Girl Farm](/assets/logo-344.webp?raw=true)

## Architecture

The CSA website has three components:

* [Web app](package/frisky-girl-farm)
* [API server](packages/frisky-girl-farm-api)
* [Admin scripts](packages/frisky-girl-farm-admin)

The webapp is an Ember app served out of S3, the API server is a Node.js/express app the runs out of AWS lambda, and the admin scripts are a Google Sheets workspace addon.

The Google Sheets spreadsheet is used as the backend data storage, which provides a more transparent/familiar environment for the farmers to administer the CSA. Some of the administration is done manually in the spreadsheet, e.g. adding users to the users sheet, setting available quantities of products each week, etc., and some is done using the UI and functionality provided by the admin scripts/workspace addon.

The API server is primarily used by the web app to manage users' orders (stored in the spreadsheet), and also by the admin scripts to send confirmation emails via AWS SES.

## Use case overview

The farm enrolls CSA members at the beginning of the season. They pay a certain amount of money upfront that they then use as credit throughout the season to buy products. The enrollment and payments are all handled externally and the farmers transcribe the user info and amount paid into the system manually.

The farmers decide on a fixed list of pickup locations, and each user chooses a pickup location when they sign up. Each week the farmers determine what products are available for purchase, what quantity of each product is available, and the price per unit, and then set a period of time when ordering is open and users can place orders. The orders are limited by the available quantities of the product, and also by the remaining balance of each individual user.

When the open ordering period ends, the farmers harvest the needed quantities of the different products, box them up by user, send confirmation emails to all the users that placed an order, and deliver them to the correct pickup locations to be picked up by the users.

## Implementation

The farmers use one Google Sheet spreadsheet for the entire season. It is analagous to a database, with the sheets as tables. It has several static sheets, e.g. one containing user account info associating user emails with pickup locations and account balances, and one describing the different pickup locations. It also has an order template sheet where the farmers can keep a list of all the products they have available throughout the season along with prices and pictures. The farmers manually update this sheet.

Each order period is represented by a separate sheet. The farmers use the admin scripts to create a copy of the orders template that they can then manually update to set available quantities for the week and adjust prices if necessary, before marking it as the active orders sheet using the admin scripts. The webapp (via the API server) recognizes when there is or isn't an active orders sheet and shows users a "ordering is not open" page or a page where they can view and their order accordingly. 

The farmers manually notify the users that ordering is open, and the users visit the website to place their orders, which, via the API server, are stored in the active orders sheet. Once the order period ends, the farmers mark the sheet as no longer active using the admin scripts. They can then use the admin scripts to generate harvest lists and per-user packing slips/receipts from the closed orders sheet, and the sheet is kept around for the website to read from to show users a history of their past orders.

## Development

Currently there is only one admin scripts workspace addon, although it could be branched into a production and staging version at some point if needed. Once a user has added that addon to their account, it is available in every Google Sheets spreadsheet they open.

There is a staging and production Google Sheet spreadsheet, and the API server is set up with a staging and production environment that each use the corresponding spreadsheet as their data storage. The API's local development server can be configured to point to the staging spreadsheet (the default) or the production spreadsheet.

The webapp's development server can be configured to run against a local API server (the default), or the staging or production API server running in AWS lambda.

So, there is currently no way to test changes to the admin scripts workspace addon without pushing them live, but there is a lot of flexibility in the other two. The dev environment web app can run against the production API server (and the production spreadsheet), or against the staging API server (and the staging spreadsheet), or against the local API development server which, in turn, can run against either the staging or production spreadsheet.

## Deployment

Because this is such a small-scale project right now and everything can be tested manually locally/in the staging environments (except the admin scripts which are only used by the farmers), successful `main` branch CI builds automatically deploy to production. For manual deployment information, check the READMEs of each package.

## CI/Deployment setup

First, set up the Google cloud project and spreadsheet that will be used for the backend storage:

1. Create a [Google Cloud project](https://cloud.google.com/resource-manager/docs/creating-managing-projects) with access to Google Sheets
2. Create a [service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) within the project with an editor or owner role. This will be used by the API server to access the spreadsheet used as its backend storage.
3. Create a [service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) for the service account (this will download a credentials file that you'll need in later steps).
6. [Enable](https://console.developers.google.com/flows/enableapi?apiid=sheets.googleapis.com) the Google Sheets API for your project.
7. Using any user account, make a copy of [this spreadsheet template](https://docs.google.com/spreadsheets/d/1gdw6m-eWT3OZ2dzEztGnws8m76nI2yKwSddvowNlQCs/edit#gid=1406465942)
8.  Invite the service account to the spreadsheet as an editor, as you would invite any user, but using the `client_email` from the downloaded credentials file from step 3.
9.  Copy the ID of the spreadsheet from its URL (`https://docs.google.com/spreadsheets/d/<id>/edit`) and add it to the downloaded credentials file from step 3 under the JSON key `spreadsheet_id`.
10. Base64-encode the downloaded credentials file (`base64 <path to file>`) and set it as the value of the `GOOGLE_SHEETS_CONFIG` GitHub repository secrent in this repository.
11. Copy the downloaded credentials file to [packages/frisky-girl-farm-api/config.prod.json] to enable manual deployments.

Next, set up the admin Google workspace addon:

1. Create an [OAuth client](https://support.google.com/cloud/answer/6158849?hl=en). This will require setting up the OAuth consent screen -- name the app `Frisky Girl Farm Admin` and use [assets/logo-120.png] as the app logo. The other steps (scopes, test users, etc.) can be skipped for now.
2. Create a [standalone Google app scripts project](https://script.google.com/create).
3. In the project settings, change the Google Cloud Platform Project to the one you created above.
4. Get the [script id](https://github.com/google/clasp#scriptid-required) from the Google app scripts project and put it in [packages/frisky-girl-admin/.clasp.json] under the `scriptId` key.
5. From `/packages/frisky-girl-farm-admin`, run `yarn clasp login` and log authorize `clasp` with your Google account that has access to the scripts project.
6. Base64-encode the generated credentials file, `base64 ~/.clasprc.json`) and set it as the value of the `CLASP_OAUTH_CREDENTIALS` GitHub repository secret in this repository, so CI can deploy the admin scripts on your behalf.
