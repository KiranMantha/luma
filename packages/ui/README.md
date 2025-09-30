# @repo/ui

This package contains all reusable UI components for the Luma CMS, built with [Chakra UI](https://chakra-ui.com/) and organized by atomic design principles.

## Structure

- **atoms/**: Basic building blocks (e.g., Button, Text)
- **molecules/**: Simple combinations (e.g., Card)
- **organisms/**: Complex structures (e.g., Header)

Each component is in its own folder with:

- `[Component].tsx`: Main component file
- `index.ts`: Barrel file for exports
- `[Component].module.scss`: SCSS module for styles

Barrel files in each group export their components, and the root `index.ts` exports all.

## Chakra UI Usage

- All components use Chakra UI primitives for layout, styling, and accessibility.
- The default font is Roboto (customized in the Chakra theme).
- To use Chakra UI in your app, wrap your root with `ChakraProvider` and import components from `@repo/ui`.

## Example Usage

```tsx
import { Button, Card, Header, Text } from '@repo/ui';

export default function Example() {
  return (
    <Card>
      <Header />
      <Text>Welcome to Luma CMS!</Text>
      <Button colorScheme="blue">Get Started</Button>
    </Card>
  );
}
```

## Customizing Theme

To customize Chakra UI theme (e.g., fonts, colors), edit `foundation/chakra/themeProvider.tsx` in this package and export your theme.

---

For more details, see the main project README and `.github/copilot-instructions.md`.
