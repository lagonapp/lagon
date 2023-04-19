import { Nav } from '@lagon/ui';
import LayoutTitle from 'lib/components/LayoutTitle';
import { getLocaleProps, useScopedI18n } from 'locales';
import { GetStaticProps } from 'next';
import SettingsGeneral from 'lib/pages/settings/SettingsGeneral';
import SettingsMembers from 'lib/pages/settings/SettingsMembers';
import SettingsBillingUsage from 'lib/pages/settings/SettingsBillingUsage';

const Settings = () => {
  const t = useScopedI18n('settings');

  return (
    <LayoutTitle title={t('title')}>
      <Nav defaultValue="general">
        <Nav.List>
          <Nav.Link value="general">{t('general')}</Nav.Link>
          <Nav.Link value="members">{t('members')}</Nav.Link>
          <Nav.Link value="billingUsage">{t('billingUsage')}</Nav.Link>
        </Nav.List>
        <Nav.Content value="general">
          <SettingsGeneral />
        </Nav.Content>
        <Nav.Content value="members">
          <SettingsMembers />
        </Nav.Content>
        <Nav.Content value="billingUsage">
          <SettingsBillingUsage />
        </Nav.Content>
      </Nav>
    </LayoutTitle>
  );
};

Settings.title = 'Settings';

export const getStaticProps: GetStaticProps = getLocaleProps();

export default Settings;
