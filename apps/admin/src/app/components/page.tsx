const atomicComponents = [
  { name: 'Text', description: 'Primitive text field.' },
  { name: 'Image', description: 'Primitive image field.' },
  { name: 'Number', description: 'Primitive number field.' },
  { name: 'Boolean', description: 'Primitive boolean field.' },
  { name: 'List', description: 'List of primitives or objects.' },
  { name: 'Object', description: 'Nestable object for composition.' },
];

export default function ComponentsPage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Create Component</h1>
      <p>
        Compose new components by combining atomic fields below. Only user-defined components will have{' '}
        <code>:type</code> and <code>model</code> attributes in their output.
      </p>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {atomicComponents.map((comp) => (
          <div key={comp.name} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 24, minWidth: 200 }}>
            <h2>{comp.name}</h2>
            <p>{comp.description}</p>
          </div>
        ))}
      </div>
      <section style={{ marginTop: 32 }}>
        <h3>Component Composition Example</h3>
        <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8 }}>
          {`
{
  ":type": "BlogPost",
  "model": {
    "title": "Hello World",
    "tags": ["cms", "nextjs"],
    "author": {
      "name": "Jane Doe",
      "bio": "Content architect"
    }
  }
}
`}
        </pre>
        <p>
          You can nest objects and lists to build complex layouts. Only the root user-defined component includes{' '}
          <code>:type</code> and <code>model</code>.
        </p>
      </section>
    </main>
  );
}
