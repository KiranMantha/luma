import { Box, Card, Flex, Link, Text } from '@repo/ui';

const dashboardCards = [
  {
    name: 'Component Builder',
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
      <Text size="7" weight="bold" className="mb-6">
        Dashboard
      </Text>
      <Flex gap="8">
        {dashboardCards.map((card) => (
          <Link key={card.name} href={card.href}>
            <Card>
              <Text size="5" weight="bold" className="mb-6">
                {card.name}
              </Text>
              <p>{card.description}</p>
            </Card>
          </Link>
        ))}
      </Flex>
    </Box>
  );
}
