import type { PlopTypes } from '@turbo/gen';
import componentGenerator from './component/config';
import packageGenerator from './package/config';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  componentGenerator(plop);
  packageGenerator(plop);
}
