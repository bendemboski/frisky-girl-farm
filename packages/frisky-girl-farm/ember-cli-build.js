'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { V1Addon } = require('@embroider/compat');
const { forceIncludeModule } = require('@embroider/compat/src/compat-utils');

class EmberDataCompatAdapter extends V1Addon {
  get packageMeta() {
    return forceIncludeModule(super.packageMeta, './-private');
  }
}

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    'ember-bootstrap': {
      bootstrapVersion: 4,
      importBootstrapFont: false,
      importBootstrapCSS: false,
    },
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  const { Webpack } = require('@embroider/webpack');
  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,

    // https://github.com/embroider-build/embroider/issues/396#issuecomment-611885598
    compatAdapters: new Map([
      ['@ember-data/model', EmberDataCompatAdapter],
      ['@ember-data/record-data', EmberDataCompatAdapter],
    ]),
  });
};
