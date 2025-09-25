const algoliasearch = require('algoliasearch');

// Client Algolia
const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);

const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);

(async () => {
  try {
    console.log("📥 Leggo i primi 20 record da Algolia...");

    // Query vuota → restituisce tutti, ma con hitsPerPage limitiamo
    const results = await index.search('', {
      hitsPerPage: 20,
    });

    results.hits.forEach((hit, i) => {
      console.log(
        `${i + 1}. Ref: ${hit.reference || 'N/A'} | Brand: ${hit.brand || 'N/A'} | Family: ${hit.family || 'N/A'} | Lug: ${hit.lug_width || 'N/A'}`
      );
    });

    console.log("✅ Fine lettura.");
  } catch (err) {
    console.error("❌ Errore lettura Algolia:", err);
  }
})();
