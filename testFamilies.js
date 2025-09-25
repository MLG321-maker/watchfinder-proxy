// testFamilies.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const algoliasearch = require('algoliasearch');

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);

(async () => {
  try {
    console.log('🔎 Stampo 5 record Rolex (qualsiasi famiglia)...');
    const res = await index.search('', {
      filters: 'brand:"Rolex"',
      hitsPerPage: 5
    });

    res.hits.forEach((h, i) => {
      console.log(`\n📌 RECORD ${i + 1}`);
      console.log(h); // stampa TUTTO l’oggetto
    });

    if (res.hits.length === 0) {
      console.log('⚠️ Nessun risultato trovato.');
    }
  } catch (err) {
    console.error('❌ Errore durante la ricerca:', err.message);
  }
})();