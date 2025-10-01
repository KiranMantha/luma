import { Card } from '@repo/ui';
import Link from 'next/link';

const componentCards = [{ name: 'Components', description: 'Reusable building blocks for content.' }];

export default function Home() {
  return (
    <main style={{ padding: 32 }}>
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
    </main>
  );
}
