// debug-algolia.js
require('dotenv').config();
const algoliasearch = require('algoliasearch');

// --- Configurazione da .env ---
const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_KEY
} = process.env;

// indice scelto da CLI oppure default "glossario"
const cliArg = process.argv[2];
const INDEX_NAME = cliArg || "glossario";

// Inizializzazione client Algolia
const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const glossaryIndex = algoliaClient.initIndex(INDEX_NAME);

async function main() {
  console.log(`📦 Lettura indice Algolia: ${INDEX_NAME}`);

  let allTerms = [];
  try {
    await glossaryIndex.browseObjects({
      batch: batch => { allTerms = allTerms.concat(batch); }
    });
  } catch (error) {
    console.error("❌ Errore durante il recupero dei dati da Algolia:", error.message);
    return;
  }

  console.log(`   -> Trovati ${allTerms.length} record.\n`);

  // Stampiamo i primi 5 record per capire la struttura reale
  allTerms.slice(0, 5).forEach((rec, idx) => {
    console.log(`🔎 Record ${idx + 1}:`);
    console.log(JSON.stringify(rec, null, 2));
  });

  // Opzionale: esporta tutto su file
  /*
  const fs = require('fs');
  fs.writeFileSync(`${INDEX_NAME}-output.json`, JSON.stringify(allTerms, null, 2));
  console.log(`📂 Esportati tutti i record in ${INDEX_NAME}-output.json`);
  */
}

main();
