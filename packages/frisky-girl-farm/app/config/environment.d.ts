/**
 * Type declarations for
 *    import config from 'frisky-girl-farm/config/environment'
 */
declare const config: {
  environment: string;
  modulePrefix: string;
  podModulePrefix: string;
  locationType: 'history' | 'hash' | 'none';
  rootURL: string;
  APP: Record<string, unknown>;
  api: {
    host: string;
    namespace: string;
  };
};

export default config;
