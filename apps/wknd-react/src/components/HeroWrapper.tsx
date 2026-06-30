import { MapTo, useLumaComponent } from '../lib/luma-preview';

type HeroData = {
  id: string;
  general?: { title?: string; subtitle?: string };
  [key: string]: unknown;
};

function HeroWrapper(props: HeroData) {
  const live = useLumaComponent<HeroData>(props.id);
  const data = live ?? props;
  const title = data.general?.title ?? 'Hero Title';
  const subtitle = data.general?.subtitle ?? '';

  return (
    <section style={{ padding: '3rem 2rem', background: '#1e3a5f', color: 'white', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: '1.25rem', marginTop: '0.75rem', opacity: 0.85 }}>{subtitle}</p>}
    </section>
  );
}

MapTo('wknd/components/hero', HeroWrapper);
