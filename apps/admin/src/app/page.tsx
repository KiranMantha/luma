import Link from 'next/link';

const componentCards = [{ name: 'Components', description: 'Reusable building blocks for content.' }];

export default function Home() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 24 }}>
        {componentCards.map((card) => (
          <Link key={card.name} href="/components">
            <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 24, minWidth: 200, cursor: 'pointer' }}>
              <h2>{card.name}</h2>
              <p>{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
