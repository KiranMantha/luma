this project take similarities from strapi, confluence & adobe experience manager. this project deliver content agnostic to any frontend framework and whether it is csr / ssr.

# Design philosophy:

- user should organise reusable parts as components
- user should be able to create master page layout via templates
- user should be able to create pages that can inherit a template structure and via drag-drop components.
- user should be able to create folder to organise pages
- once user saves a page, that page content should be delivered via rest api as json content.
- the project dashboard should display cards denoting components, templates, pages.
- user can create components / templates / pages by clicking on respective cards
- just like aem, when user clicks on pages card, they should see vertical sections denoting project => folder => page. user should see create button to either create a page or folder.
- once user creates a page, user can select that page and click on edit / view page properties.
- once user starts editing a page, user should see all components in a sidebar and can drag drop them to create the page structure.
- all edits should save as json struture for better portability

## Tech stack

- use turborepo to manage monorepo
- nextjs app router (server components + client components)
- use preact signals for react as state management
- keep reusable components in packages/ui
- use scss modules for styling
- use sqlite for db (for poc, later can move to postgres)
