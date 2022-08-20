'use strict';

const apiConfigs = {
  prod: {
    host: 'https://uh7v0bgk40.execute-api.us-west-2.amazonaws.com',
    namespace: 'prod',
  },
  staging: {
    host: 'https://yukpp0dfe2.execute-api.us-west-2.amazonaws.com',
    namespace: 'staging',
  },
  local: {
    host: 'http://localhost:3000',
    namespace: '',
  },
};

module.exports = function (environment) {
  let ENV = {
    modulePrefix: 'frisky-girl-farm',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    localSettings: {
      serializer: 'json',
      adapter: 'local-storage',
    },

    api: apiConfigs.prod,
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;

    ENV.api = apiConfigs.local;
  }

  if (process.env.FRISKY_GIRL_API) {
    ENV.api = apiConfigs[process.env.FRISKY_GIRL_API];
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;

    ENV.localSettings.adapter = 'local-memory';

    ENV.api.host = '';
    ENV.api.namespace = '';
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  return ENV;
};
