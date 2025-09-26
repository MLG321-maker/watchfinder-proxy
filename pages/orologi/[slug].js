import algoliasearch from "algoliasearch";

export async function getServerSideProps({ params }) {
  console.log("🔎 [slug] richiesto:", params.slug);
  console.log("🔑 Variabili ENV:", {
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID ? "OK" : "❌",
    ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY ? "OK" : "❌",
    WATCH_INDEX_NAME: process.env.WATCH_INDEX_NAME || "❌",
  });

  try {
    const client = algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.ALGOLIA_API_KEY
    );
    const index = client.initIndex(process.env.WATCH_INDEX_NAME);

    // cerca il record corrispondente allo slug
    const record = await index.getObject(params.slug).catch(() => null);

    if (!record) {
      console.error("❌ Nessun record trovato per slug:", params.slug);
      return { notFound: true };
    }

    console.log("✅ Record trovato:", record);

    return {
      props: { record },
    };
  } catch (err) {
    console.error("💥 Errore in getServerSideProps:", err);
    return {
      props: { error: err.message || "Errore interno" },
    };
  }
}

export default function OrologioPage({ record, error }) {
  if (error) {
    return <div>❌ Errore: {error}</div>;
  }

  if (!record) {
    return <div>⚠️ Orologio non trovato</div>;
  }

  return (
    <div>
      <h1>{record.Name || "Orologio senza nome"}</h1>
      <p>Ref: {record.Reference}</p>
      <p>Lug Width: {record.LugWidth || "N/A"}</p>
    </div>
  );
}