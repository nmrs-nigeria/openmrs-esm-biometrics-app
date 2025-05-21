/**
 * This is the entrypoint file of the application. It communicates the
 * important features of this microfrontend to the app shell. It
 * connects the app shell to the React application(s) that make up this
 * microfrontend.
 */
import { getAsyncLifecycle, defineConfigSchema, getSyncLifecycle } from '@openmrs/esm-framework';
import {createHomeDashboardLink, createLeftPanelLink} from "./components/left-panel-link.component";
import { configSchema } from './config-schema';

const moduleName = '@openmrs/esm-patient-biometrics-app';

const options = {
  featureName: 'root-world',
  moduleName,
};

export const leftBarLink = getSyncLifecycle(
  createHomeDashboardLink({
    name: 'patient-biometric-dashbaord',
    slot: 'patient-biometric-dashbaord-slot',
    title: 'Patient Biometric Dasbboard',
  }),
  options,
);

export const loadingModal = getAsyncLifecycle(() => import('./modal/loading.modal'), {
  featureName: 'loading-modal',
  moduleName,
});

/**
 * This tells the app shell how to obtain translation files: that they
 * are JSON files in the directory `../translations` (which you should
 * see in the directory structure).
 */
export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

/**
 * This function performs any setup that should happen at microfrontend
 * load-time (such as defining the config schema) and then returns an
 * object which describes how the React application(s) should be
 * rendered.
 */
export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

/**
 * This named export tells the app shell that the default export of `root.component.tsx`
 * should be rendered when the route matches `root`. The full route
 * will be `openmrsSpaBase() + 'root'`, which is usually
 * `/openmrs/spa/root`.
 */
export const root = getAsyncLifecycle(() => import('./root.component'), options);

/**
 * The following are named exports for the extensions defined in this frontend modules. See the `routes.json` file to see how these are used.
 */
export const redBox = getAsyncLifecycle(() => import('./boxes/extensions/red-box.component'), options);

export const blueBox = getAsyncLifecycle(() => import('./boxes/extensions/blue-box.component'), options);

export const brandBox = getAsyncLifecycle(() => import('./boxes/extensions/brand-box.component'), options);
