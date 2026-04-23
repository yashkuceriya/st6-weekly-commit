import { defineConfig } from 'cypress';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.feature',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    viewportWidth: 1440,
    viewportHeight: 900,
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on(
        'file:preprocessor',
        // Plugin type drift between hoisted root esbuild and e2e-local esbuild;
        // both ship the same shape but TS sees them as nominally different.
        createBundler({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plugins: [createEsbuildPlugin(config) as any],
        }),
      );
      return config;
    },
  },
});
