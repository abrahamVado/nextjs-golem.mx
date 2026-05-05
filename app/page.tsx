export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>nextjs-golem.mx</h1>
      <p>Frontend is running.</p>
      <a href="/api/v1/health">Check API health through Nginx</a>
    </main>
  );
}
