// uploadDaytona.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const algoliasearch = require('algoliasearch');
const fs = require('fs');

// Config da .env
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_API_KEY = process.env.ALGOLIA_ADMIN_KEY; // ⚠️ Admin key, non la search-only
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;

if (!ALGOLIA_APP_ID || !ALGOLIA_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("❌ Variabili ambiente mancanti");
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

// Legge il file JSON
const data = JSON.parse(fs.readFileSync('daytona-test.json', 'utf8'));

(async () => {
  try {
    const res = await index.saveObjects(data, { autoGenerateObjectIDIfNotExist: false });
    console.log("✅ Caricati su Algolia:", res.objectIDs);
  } catch (err) {
    console.error("❌ Errore upload:", err);
  }
})();
