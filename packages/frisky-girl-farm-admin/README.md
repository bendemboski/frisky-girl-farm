# Frisky Girl Farm Admin

A Google Workspace Sheets Addon implementing the administrative interface

## Overview

This projects implements a Google Workspace Addon that runs in Google Sheets. Farmers can use it from within the spreadsheet that is the backend storage for the API server. It allows them to perform automated administrative tasks such as preparing/opening/closing orders, generating harvest lists and packing slips/receipts for a given order period, and sending confirmation emails to CSA members.

## Deployment setup

This project is set up to use [clasp](https://github.com/google/clasp), which is well documented. The quick list of useful commands is:

* `yarn clasp login` -- log in to be able to push code to the workspace addon
* `yarn clasp push` -- push local code to the workspace addon

Successful CI `main` builds auto-deploy using OAuth credentials configured in the `CLASP_OAUTH_CREDENTIALS` GitHub repository secret.
