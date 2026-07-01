import { MapTo } from '../lib/luma-preview';

type ImageBlockData = {
  id: string;
  general?: { src?: string; alt?: string; caption?: string };
  [key: string]: unknown;
};

function ImageBlockWrapper(props: ImageBlockData) {
  const src = props.general?.src ?? '';
  const alt = props.general?.alt ?? '';
  const caption = props.general?.caption ?? '';

  if (!src) return null;

  return (
    <figure style={{ margin: '2rem auto', maxWidth: '860px', padding: '0 2rem' }}>
      <img src={src} alt={alt} style={{ width: '100%', borderRadius: '8px' }} />
      {caption && (
        <figcaption style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

MapTo('wknd/components/imageBlock', ImageBlockWrapper, {
  displayName: 'Image Block',
  placeholder: 'Image Block — click Edit to set image URL',
});
