// checkFamilyRoot.js
require('dotenv').config();
const algoliasearch = require('algoliasearch');

const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY); // search-only key qui va bene
const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);

(async () => {
  const res = await index.search('', {
    filters: 'brand:"Rolex"',
    hitsPerPage: 5,
    attributesToRetrieve: ['reference', 'family', 'family_root']
  });

  console.log("📊 Campione Rolex con family_root:");
  res.hits.forEach(h => {
    console.log({
      ref: h.reference,
      fam: h.family,
      root: h.family_root
    });
  });
})();
