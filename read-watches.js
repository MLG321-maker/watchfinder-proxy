// read-watches-detailed.js
require('dotenv').config();
const algoliasearch = require('algoliasearch');

// Connessione con Algolia (usa Search API Key per leggere)
const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);

const index = client.initIndex("watchdatabase1");

(async () => {
  const query = "116518LN";  // reference da cercare
  console.log("📥 Query:", query);

  try {
    const results = await index.search(query, {
      attributesToRetrieve: [
        "objectID",
        "brand",
        "reference",
        "name",
        "family",
        "family_root",
        "lug_width",
        "diameter",
        "movement",
        "materials"
      ],
      hitsPerPage: 50
    });

    console.log("🔎 Totale risultati:", results.hits.length);

    results.hits.forEach((hit, i) => {
      console.log(
        `#${i + 1} | Brand: ${hit.brand} | Ref: ${hit.reference} | Name: ${hit.name || "—"}\n` +
        `   Family: ${hit.family || "—"} | Root: ${hit.family_root || "—"}\n` +
        `   Lug: ${hit.lug_width || "—"} | Diametro: ${hit.diameter || "—"}\n` +
        `   Movimento: ${hit.movement || "—"} | Materiali: ${hit.materials || "—"}\n`
      );
    });
  } catch (err) {
    console.error("❌ Errore in search:", err);
  }
})();