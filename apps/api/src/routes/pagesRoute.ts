import { Hono } from 'hono';
import {
  addComponentToPage,
  createFolder,
  createPage,
  deleteFolder,
  deletePage,
  getAllFolders,
  getAllPages,
  getPageById,
  publishPage,
  updatePage,
} from '../controllers';

const pagesRoute = new Hono();

// Page management
pagesRoute.get('/', getAllPages);
pagesRoute.get('/:id', getPageById);
pagesRoute.post('/', createPage);
pagesRoute.put('/:id', updatePage);
pagesRoute.delete('/:id', deletePage);
pagesRoute.post('/:id/publish', publishPage);
pagesRoute.post('/:id/components', addComponentToPage);

// Folder management
pagesRoute.get('/folders/all', getAllFolders);
pagesRoute.post('/folders', createFolder);
pagesRoute.delete('/folders/:id', deleteFolder);

export { pagesRoute };
