// testDaytona.js
// Test rapido per verificare family_root su Algolia

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const algoliasearch = require('algoliasearch');

// Config da .env
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY; // search-only key
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;

if (!ALGOLIA_APP_ID || !ALGOLIA_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error('❌ Config Algolia mancante. Controlla .env');
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

(async () => {
  console.log('🔎 Cerco 10 Rolex della famiglia Daytona...');

  try {
    const res = await index.search('', {
      filters: 'brand:"Rolex" AND family_root:"Daytona"',
      hitsPerPage: 10,
      attributesToRetrieve: ['reference','family','family_root','name']
    });

    if (!res.hits.length) {
      console.log('⚠️ Nessun Daytona trovato.');
    } else {
      res.hits.forEach((h, i) => {
        console.log(`📌 #${i+1}`, {
          ref: h.reference,
          fam: h.family,
          root: h.family_root,
          name: h.name
        });
      });
    }
  } catch (err) {
    console.error('❌ Errore ricerca:', err.message);
  }
})();

