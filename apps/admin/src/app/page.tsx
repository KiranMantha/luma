import { Box } from '@radix-ui/themes';
import { Card, Link } from '@repo/ui';

const componentCards = [{ name: 'Components', description: 'Reusable building blocks for content.' }];

export default function Home() {
  return (
    <Box p={'4'}>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 24 }}>
        {componentCards.map((card) => (
          <Link key={card.name} href="/components">
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
