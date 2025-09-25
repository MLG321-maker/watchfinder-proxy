// sync-shopify.js
require('dotenv').config();
const algoliasearch = require('algoliasearch');
const axios = require('axios');

// --- Utility: slugify per creare handle puliti ---
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/[^a-z0-9]+/g, '-')     // non-alfa → trattino
    .replace(/(^-|-$)/g, '');        // rimuove trattini iniziali/finali
}

// --- Configurazione ---
const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_KEY,
  SHOPIFY_STORE_URL,
  SHOPIFY_ADMIN_TOKEN,
} = process.env;

const API_VERSION = '2024-07';
const GLOSSARY_INDEX_NAME = 'glossario';

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  console.error("❌ ERRORE CRITICO: Manca ALGOLIA_APP_ID o ALGOLIA_ADMIN_KEY nel file .env");
  process.exit(1);
}
if (!SHOPIFY_ADMIN_TOKEN || !SHOPIFY_STORE_URL) {
  console.error("❌ ERRORE CRITICO: Manca SHOPIFY_ADMIN_TOKEN o SHOPIFY_STORE_URL nel file .env");
  process.exit(1);
}

// --- Client Algolia ---
const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const glossaryIndex = algoliaClient.initIndex(GLOSSARY_INDEX_NAME);

// --- Client Shopify ---
const shopifyAdminAPI = axios.create({
  baseURL: `https://${SHOPIFY_STORE_URL.replace(/^https?:\/\//, '')}/admin/api/${API_VERSION}/graphql.json`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    'Content-Type': 'application/json',
  },
});

// --- Funzione per chiamate GraphQL ---
async function makeShopifyRequest(query, variables = {}) {
  try {
    const response = await shopifyAdminAPI.post('', { query, variables });
    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors, null, 2));
    }
    return response.data;
  } catch (error) {
    console.error("❌ Errore nella richiesta GraphQL a Shopify:", error.message);
    throw error;
  }
}

// --- Funzione Principale ---
async function syncGlossaryToShopify() {
  console.log("🚀 Avvio sincronizzazione da Algolia a Shopify Metaobjects...");

  // 1. Recupero termini da Algolia
  let allTerms = [];
  try {
    await glossaryIndex.browseObjects({
      batch: (batch) => {
        allTerms = allTerms.concat(batch);
      },
    });
  } catch (error) {
    console.error("❌ Errore durante il recupero dei dati da Algolia:", error.message);
    return;
  }

  console.log(`📦 Trovati ${allTerms.length} record in Algolia`);
  if (allTerms.length === 0) {
    console.log("Nessun termine da sincronizzare.");
    return;
  }

  // 2. Creazione/aggiornamento su Shopify
  for (const term of allTerms) {
    if (!term.term) continue;

    const handle = slugify(term.term);

    const mutation = `
      mutation upsertFromHandle($handle: String!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(
          handle: { handle: $handle, type: "termine_glossario" }
          metaobject: $metaobject
        ) {
          metaobject { id handle }
          userErrors { field message }
        }
      }
    `;

    const variables = {
      handle,
      metaobject: {
        fields: [
          { key: "term", value: term.term || "" },
          { key: "definition", value: term.definition || "" },
          { key: "description_ai", value: term.description_ai || "" },
          { key: "category", value: term.category || "" },
        ],
      },
    };

    try {
      const response = await makeShopifyRequest(mutation, variables);
      const result = response.data.metaobjectUpsert;

      if (result.userErrors.length > 0) {
        console.error(`   -> ❌ Errore per "${term.term}":`, result.userErrors[0].message);
      } else {
        console.log(`   -> ✅ Sincronizzato con successo: "${term.term}"`);
      }
    } catch (error) {
      // errore già stampato
    }
  }

  console.log("\n✅ Sincronizzazione completata!");
}

syncGlossaryToShopify();
