import { getSettings } from '@/actions/settings';
import { Suspense } from 'react';
import { SettingsPage } from './SettingsPage';

export default function SettingsRoute() {
  const settingsPromise = getSettings();
  return (
    <Suspense fallback={<div>Loading settings…</div>}>
      <SettingsPage initialSettings={settingsPromise} />
    </Suspense>
  );
}
