// testCheckDaytona.js
require('dotenv').config();
const algoliasearch = require('algoliasearch');

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);

(async () => {
  console.log("🔎 Cerco Rolex con family che contiene 'Daytona'...");

  const res = await index.search('Daytona', {
    filters: 'brand:"Rolex"',
    hitsPerPage: 10,
    attributesToRetrieve: ['reference','family','family_root']
  });

  if (!res.hits.length) {
    console.log("⚠️ Nessun modello trovato con 'Daytona'.");
  } else {
    res.hits.forEach((h, i) => {
      console.log(`📌 RECORD ${i+1}`);
      console.log({
        ref: h.reference,
        fam: h.family,
        root: h.family_root
      });
    });
  }
})();
