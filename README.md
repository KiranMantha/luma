# Luma CMS

Luma is a component & template-driven CMS inspired by Strapi, Contentful, and AEM. It delivers content agnostic to any frontend framework and supports both CSR and SSR.

## Architecture

- **Monorepo managed by Turborepo**: Apps and packages organized under `apps/` and `packages/`.
- **Frontend**: Next.js App Router (CMS UI) in `apps/cms`.
- **UI Library**: All UI components are built in `packages/ui` using Chakra UI and organized by atomic design (atoms, molecules, organisms). No components live in app folders.
- **Backend**: Separate backend app (e.g., Hono) for API and SQLite database.
- **Database**: SQLite for fast, embedded storage (scales to 10,000+ pages easily).

## Atomic UI Pattern

- Components are grouped as atoms, molecules, and organisms in `packages/ui/src/`.
- Each component has its own folder with:
  - `index.ts` (barrel file)
  - `[Component].tsx` (main file)
  - `[Component].module.scss` (SCSS module)
- Barrel files in each group export their components, and the root `index.ts` exports all.
- Chakra UI is used for all styling and layout. The default font is Roboto.

## Content Model & Output

- User-defined components are saved as JSON with `:type` and `model` attributes at the root.
- Supports primitives, objects (nestable), and lists for flexible composition.
- Example output:
  ```json
  {
    ":type": "BlogPost",
    "model": {
      "title": "Hello World",
      "tags": ["cms", "nextjs"],
      "author": { "name": "Jane Doe", "bio": "Content architect" }
    }
  }
  ```

## Developer Workflow

- Build: `pnpm exec turbo build` or `turbo build`
- Develop: `pnpm exec turbo dev` or `turbo dev`
- All UI imports must come from `@repo/ui`.
- Backend API handles all data persistence and business logic.

## Why SQLite?

- Embedded, zero-config, and fast for most CMS use cases.
- Can handle thousands of pages with ease.
- Easy to migrate to Postgres or MongoDB if needed.

## Useful Links

- [Turborepo Docs](https://turborepo.com/docs)
- [Chakra UI](https://chakra-ui.com/)
- [Next.js](https://nextjs.org/)
- [SQLite](https://www.sqlite.org/index.html)

---

For more details, see `.github/copilot-instructions.md` and the `ui` package README.

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `cms`: [Next.js](https://nextjs.org/) CMS admin interface
- `api`: Backend API server with SQLite database
- `@repo/ui`: React component library shared by applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
