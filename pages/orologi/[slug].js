// pages/orologi/[slug].js
export default function WatchSlugPage({ slug }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🔎 Pagina dinamica per slug</h1>
      <p>Slug ricevuto: <strong>{slug}</strong></p>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params;

  return {
    props: {
      slug: slug || null,
    },
  };
}