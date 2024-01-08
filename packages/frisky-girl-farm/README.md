# frisky-girl-farm

The front-end web app for the Frisky Girl Farm CSA web site.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/)
* [Yarn](https://yarnpkg.com/)
* [Ember CLI](https://cli.emberjs.com/release/)
* [Google Chrome](https://google.com/chrome/)

## Installation

* `git clone <repository-url>` this repository
* `cd frisky-girl-farm`
* `yarn install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).
* Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

When running in development mode, the app will try to connect to the API server running at `http://localhost:3000` (which can be configured in `config/environment.js`). For convenience, the `FRISKY_GIRL_API` environment variable can be set to `staging` or `prod` to run against the staging or production API server in AWS lambda (see the API server's README for more info).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `ember test`
* `ember test --server`

### Linting

* `yarn lint`
* `yarn lint:fix`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

This project uses [ember-cli-deploy](http://ember-cli-deploy.com/) to deploy to S3. There is no staging environment for the web app since it can be run against any API server locally, so successful CI builds automatically deploy to and activate in production. The GitHub action that does these deployments expects `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables for a user with with write access to the S3 bucket to be configured in the environment via GitHub repository/environment secrets.

For deploying manually, refer to the `ember-cli-deploy` documentation. You will need to AWS credentials configured for a user with permission to write to the S3 bucket using the AWS SDK, which can be done via environment variables or a `~/.aws/credentials` file. This package has `dotenv-cli` installed and scripts in `package.json` that use it to invoke deployment comments, so you can set environment variables like your credentials or `AWS_PROFILE` in a `.env` file in this directory.

## Further Reading / Useful Links

* [ember.js](https://emberjs.com/)
* [ember-cli](https://cli.emberjs.com/release/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)
