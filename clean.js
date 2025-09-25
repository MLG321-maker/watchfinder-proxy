require('dotenv').config();
const algoliasearch = require('algoliasearch');

const APP_ID = process.env.ALGOLIA_APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;

if (!APP_ID || !ADMIN_KEY || !INDEX_NAME) {
  console.error('❌ ERRORE: Controlla che nel file .env ci siano ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY, e ALGOLIA_INDEX_NAME!');
  process.exit(1);
}

const client = algoliasearch(APP_ID, ADMIN_KEY);
const index = client.initIndex(INDEX_NAME);

function cleanReference(ref) {
  if (typeof ref !== 'string' || !ref) return ref;
  return ref.split('(')[0].trim().replace(/-\d{2,}(?:-\d{2,})?$/, '').trim();
}

async function runCleaning() {
  console.log(`🧹 Inizio pulizia dell'indice "${INDEX_NAME}"...`);
  let hits = [];
  try {
    await index.browseObjects({ query: '', batch: batch => { hits = hits.concat(batch); } });
  } catch (error) {
    console.error("❌ Errore durante il recupero dei dati da Algolia:", error.message);
    return;
  }
  console.log(`📄 Trovati ${hits.length} record da analizzare.`);
  const recordsToUpdate = [];
  for (const hit of hits) {
    const originalRef = hit.reference;
    const cleanedRef = cleanReference(originalRef);
    if (originalRef !== cleanedRef) {
      recordsToUpdate.push({ ...hit, reference: cleanedRef });
      console.log(`✏️  [${originalRef}]  -->  [${cleanedRef}]`);
    }
  }
  if (recordsToUpdate.length === 0) {
    console.log('✅ Nessun record da pulire. Il tuo indice è già perfetto!');
    return;
  }
  console.log(`\n✨ Trovati ${recordsToUpdate.length} record da aggiornare. Invio le modifiche ad Algolia...`);
  try {
    await index.saveObjects(recordsToUpdate);
    console.log('✅ Pulizia completata con successo!');
  } catch (error) {
    console.error("❌ Errore durante l'aggiornamento dei record:", error.message);
  }
}

console.log('⚠️  ATTENZIONE: Questo script modificherà i dati nel tuo indice. Si consiglia un backup da Algolia.\n');
runCleaning();