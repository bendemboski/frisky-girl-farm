module.exports = function () {
  let ENV = {
    build: {
      environment: 'production',
    },
    s3: {
      region: 'us-west-2',
      bucket: 'csa.friskygirlfarm.com',
    },
    's3-index': {},
    'revision-data': {
      type: 'version-commit',
    },
  };

  ENV['s3-index'].region = ENV.s3.region;
  ENV['s3-index'].bucket = ENV.s3.bucket;

  return ENV;
};
