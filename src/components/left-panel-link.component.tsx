import React, { useMemo } from 'react';
import last from 'lodash-es/last';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ConfigurableLink } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { getPatientUuidFromStore } from '../store/patient-chart-store';
export interface LinkConfig {
  name: string;
  title: string;
}

function LinkExtension({ config }: { config: LinkConfig }) {
  const { name, title } = config;
  const location = useLocation();
  let urlSegment = useMemo(() => decodeURIComponent(last(location.pathname.split('/'))), [location.pathname]);
  const isUUID = (value) => {
    const regex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
    return regex.test(value);
  };
  if (isUUID(urlSegment)) {
    urlSegment = 'summary';
  }
  return (
    <ConfigurableLink
      to={`${window.getOpenmrsSpaBase()}test`}
      className={`cds--side-nav__link ${name === urlSegment && 'active-left-nav-link'}`}
    >
      {title}{' '}
    </ConfigurableLink>
  );
}

export const createLeftPanelLink = (config: LinkConfig) => () => (
  <BrowserRouter>
    {' '}
    <LinkExtension config={config} />{' '}
  </BrowserRouter>
);


export interface DashboardLinkConfig {
  name: string;
  title: string;
  slot?: string;
}

function DashboardExtension({ dashboardLinkConfig }: { dashboardLinkConfig: DashboardLinkConfig }) {
  const { t } = useTranslation();
  const { name, title } = dashboardLinkConfig;
  const location = useLocation();
  const patientUuid = "cc871be3-4928-4a55-a808-b54903cef723"//getPatientUuidFromStore();
  const spaBasePath = `${window.spaBase}/patients/cc871be3-4928-4a55-a808-b54903cef723`;

  const navLink = useMemo(() => {
    const pathArray = location.pathname.split('/patients/cc871be3-4928-4a55-a808-b54903cef723');
    const lastElement = pathArray[pathArray.length - 1];
    return decodeURIComponent(lastElement);
  }, [location.pathname]);


  return (
    <ConfigurableLink
      to={`${window.spaBase}/patients/${patientUuid}`}
     className={`cds--side-nav__link ${navLink.match(name) && 'active-left-nav-link'}`}
    >
      {t(title)}
    </ConfigurableLink>
  );
}

export const createHomeDashboardLink = (dashboardLinkConfig: DashboardLinkConfig) => () =>
  (
    <BrowserRouter>
      <DashboardExtension dashboardLinkConfig={dashboardLinkConfig} />
    </BrowserRouter>
  );
