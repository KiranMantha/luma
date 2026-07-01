import '../lib/import-components';
import { LumaProvider, Page } from '../lib/luma-preview';

export function PreviewPage() {
  return (
    <LumaProvider>
      <Page />
    </LumaProvider>
  );
}
