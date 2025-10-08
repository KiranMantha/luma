import { getComponents } from './actions';
import { ComponentsPage as ComponentsPageClient } from './ComponentsPage';

export default async function ComponentsPage() {
  // Get user-created components from the server/database
  const userComponents = await getComponents();

  // Only show user-defined components in the list
  // Primitive components will be available through the "Add Control" dialog
  return <ComponentsPageClient initialComponents={userComponents} />;
}
