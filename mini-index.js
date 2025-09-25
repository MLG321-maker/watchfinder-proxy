// mini-index-debug.js
const algoliasearch = require("algoliasearch");

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_KEY,
  ALGOLIA_INDEX_NAME
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("❌ Mancano variabili Algolia (.env).");
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

async function run() {
  const reference = "116518LN";
  console.log("📥 Ricerca per reference:", reference);

  try {
    // 🔎 Ricerca diretta nel campo reference
    const result = await index.search(reference, {
      restrictSearchableAttributes: ["reference"],
      hitsPerPage: 5
    });

    if (result.hits.length === 0) {
      console.log("❌ Nessun risultato trovato");
    } else {
      console.log(`✅ Trovati ${result.hits.length} risultati:`);
      result.hits.forEach((hit, i) => {
        console.log(
          `#${i + 1} reference=${hit.reference}, brand=${hit.brand}, family=${hit.family}`
        );
      });
    }
  } catch (err) {
    console.error("❌ Errore in ricerca Algolia:", err);
  }
}

run();