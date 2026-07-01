import { Hono } from 'hono';
import {
  addPageInstance,
  createFolder,
  createPage,
  deleteFolder,
  deletePage,
  getAllFolders,
  getAllPages,
  getPageBySlug,
  getPageForEdit,
  publishPage,
  saveDraft,
  updatePage,
  updatePageInstance,
} from '../controllers';

const pagesRoute = new Hono();

// Page management
pagesRoute.get('/', getAllPages);
pagesRoute.get('/slug/:slug', getPageBySlug);   // resolved components[] — for remote apps
pagesRoute.get('/edit/:slug', getPageForEdit);  // raw zones[] — for CMS editor (prefers draft)
pagesRoute.post('/', createPage);
pagesRoute.put('/:id', updatePage);
pagesRoute.delete('/:id', deletePage);
pagesRoute.post('/:id/draft', saveDraft);       // save zones as draft, keep published intact
pagesRoute.post('/:id/publish', publishPage);   // promote draft → published

// Component instance management (always writes into draft)
pagesRoute.post('/:id/instances', addPageInstance);
pagesRoute.put('/:id/instances/:instanceId', updatePageInstance);

// Folder management
pagesRoute.get('/folders/all', getAllFolders);
pagesRoute.post('/folders', createFolder);
pagesRoute.delete('/folders/:id', deleteFolder);

export { pagesRoute };
