import { MapTo } from '../lib/luma-preview';

type RichTextData = {
  id: string;
  general?: { body?: string };
  [key: string]: unknown;
};

function RichTextWrapper(props: RichTextData) {
  const body = props.general?.body ?? '<p>Rich text content</p>';

  return (
    <section style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </section>
  );
}

MapTo('wknd/components/richText', RichTextWrapper, {
  displayName: 'Rich Text',
  placeholder: 'Rich Text — click Edit to enter content',
});
