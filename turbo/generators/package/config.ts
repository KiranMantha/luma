import type { PlopTypes } from '@turbo/gen';

export default function packageGenerator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('turbo-package', {
    description: 'Adds a new turbo package',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the package?',
      },
    ],
    actions: [
      {
        type: 'addMany',
        destination: 'packages/{{name}}',
        base: 'package/templates',
        templateFiles: 'package/templates/**',
      },
      () => {
        return `👉 Run \`pnpm install\` to update the node_modules.`;
      },
    ],
  });
}