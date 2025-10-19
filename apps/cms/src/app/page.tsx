import { Box, Card, Link } from '@repo/ui';

const dashboardCards = [
  {
    name: 'Components',
    description: 'Reusable building blocks for content.',
    href: '/components',
  },
  {
    name: 'Templates',
    description: 'Master page layouts for consistent structure.',
    href: '/templates',
  },
  {
    name: 'Pages',
    description: 'Create and organize your content pages.',
    href: '/pages',
  },
];

export default function Home() {
  return (
    <Box className="p-4">
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 24 }}>
        {dashboardCards.map((card) => (
          <Link key={card.name} href={card.href}>
            <Card>
              <h2>{card.name}</h2>
              <p>{card.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Box>
  );
}
