# Frisky Girl Farm Admin

A Google Workspace Sheets Addon implementing the administrative interface

## Overview

This projects implements a Google Workspace Addon that runs in Google Sheets. Farmers can use it from within the spreadsheet that is the backend storage for the API server. It allows them to perform automated administrative tasks such as preparing/opening/closing orders, generating harvest lists and packing slips/receipts for a given order period, and sending confirmation emails to CSA members.

## Deployment setup

This project is set up to use [clasp](https://github.com/google/clasp), which is well documented. The quick list of useful commands is:

* `pnpm clasp login` -- log in to be able to push code to the workspace addon
* `pnpm clasp push` -- push local code to the workspace addon

Successful CI `main` builds auto-deploy using OAuth credentials configured in the `CLASP_OAUTH_CREDENTIALS` GitHub repository secret.

## Running the addon

Because the addon is unpublished, to run it, users need to be added to the Google Cloud Project as test users. Go to the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) settings for the project and add the user as a test user. Share the app scripts project with them (if needed), and then they can follow the instructions to [install the unpublished addon](https://developers.google.com/workspace/add-ons/how-tos/testing-gsuite-addons#install_an_unpublished_add-on). Then they can go into a spreadsheet, and will see the addon in the right side bar and can open, authorize, and start using it.