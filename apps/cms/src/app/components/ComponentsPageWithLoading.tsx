import { Suspense } from 'react';
import { ComponentsPage } from './ComponentsPage';
import type { ComponentsPageProps } from './ComponentsPage/ComponentsPage.model';
import styles from './ComponentsPage/ComponentsPage.module.scss';

const ComponentsPageWithLoading = (props: ComponentsPageProps) => {
  return (
    <Suspense
      fallback={
        <div className={styles.componentsPage}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}>⏳</div>
            <p>Loading components from database...</p>
          </div>
        </div>
      }
    >
      <ComponentsPage {...props} />
    </Suspense>
  );
};

export { ComponentsPageWithLoading };
