// debug-definizioni.js
require('dotenv').config();
const axios = require('axios');

const {
  SHOPIFY_STORE_URL,
  SHOPIFY_ADMIN_TOKEN
} = process.env;

const API_VERSION = '2024-07'; // puoi provare anche '2024-10'

// Controllo variabili env
if (!SHOPIFY_ADMIN_TOKEN || !SHOPIFY_STORE_URL) {
  console.error("❌ ERRORE: manca SHOPIFY_ADMIN_TOKEN o SHOPIFY_STORE_URL nel file .env");
  process.exit(1);
}

// Client axios per Shopify
const shopifyAdminAPI = axios.create({
  baseURL: `https://${SHOPIFY_STORE_URL.replace(/^https?:\/\//, '')}/admin/api/${API_VERSION}/graphql.json`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    'Content-Type': 'application/json',
  },
});

async function main() {
  const query = `
    query {
      metaobjectDefinitions(first: 50) {
        edges {
          node {
            id
            name
            type
          }
        }
      }
    }
  `;

  try {
    const response = await shopifyAdminAPI.post('', { query });
    if (response.data.errors) {
      console.error("❌ Errori GraphQL:", JSON.stringify(response.data.errors, null, 2));
      return;
    }

    const defs = response.data.data.metaobjectDefinitions.edges.map(e => e.node);
    console.log("✅ Definizioni trovate su Shopify:");
    defs.forEach(d => {
      console.log(`- ${d.name} (ID: ${d.id}, Tipo: ${d.type})`);
    });
  } catch (err) {
    console.error("❌ Errore nella richiesta:", err.message);
  }
}

main();
