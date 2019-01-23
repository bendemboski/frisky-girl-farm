'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'frisky-girl-farm',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    localSettings: {
      serializer: 'json',
      adapter: 'local-storage'
    },

    api: {
      host: 'https://qh0g0s7o0k.execute-api.us-west-2.amazonaws.com',
      namespace: 'stage'
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;

    ENV.api.host = 'http://localhost:3000';
    ENV.api.namespace = '';
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
