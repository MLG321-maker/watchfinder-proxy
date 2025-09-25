// print-fields.js
// Utility per stampare i campi disponibili di un record in Algolia

const algoliasearch = require('algoliasearch');
require('dotenv').config();

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_KEY,
  WATCH_INDEX_NAME
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY || !WATCH_INDEX_NAME) {
  console.error("❌ Config mancante, controlla .env");
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = client.initIndex(WATCH_INDEX_NAME);

(async () => {
  try {
    // prendi il primo record per esempio
    const res = await index.search('', { hitsPerPage: 1 });
    if (!res.hits.length) {
      console.log("Nessun record trovato.");
      return;
    }

    const watch = res.hits[0];
    console.log("📦 Campi disponibili nel record:\n");
    console.log(Object.keys(watch));
    console.log("\n📄 Contenuto completo del record:\n");
    console.dir(watch, { depth: null });
  } catch (err) {
    console.error("❌ Errore:", err.message);
  }
})();