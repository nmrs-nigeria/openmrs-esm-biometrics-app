/**
 * From here, the application is pretty typical React, but with lots of
 * support from `@openmrs/esm-framework`. Check out `Greeter` to see
 * usage of the configuration system, and check out `PatientGetter` to
 * see data fetching using the OpenMRS FHIR API.
 *
 * Check out the Config docs:
 *   https://openmrs.github.io/openmrs-esm-core/#/main/config
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes } from './boxes/slot/boxes.component';
import Greeter from './greeter/greeter.component';
import PatientGetter from './patient-getter/patient-getter.component';
import Resources from './resources/resources.component';
import styles from './root.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PatientBiometricDashboard from './patient-biometric-dashboard.component';

const Root: React.FC = () => {
  const { t } = useTranslation();

  return (
    <BrowserRouter basename={`${window.spaBase}/patients/cc871be3-4928-4a55-a808-b54903cef723`}>
    <Routes>
      <Route path="/" element={<PatientBiometricDashboard />} />
    </Routes>
  </BrowserRouter>
  );
};

export default Root;
