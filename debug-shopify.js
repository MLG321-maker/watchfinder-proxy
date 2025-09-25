require('dotenv').config();
const axios = require('axios');

const {
  SHOPIFY_STORE_URL,
  SHOPIFY_ADMIN_TOKEN
} = process.env;

const API_VERSION = '2024-07';
const definitionId = "gid://shopify/MetaobjectDefinition/12568363042";

const shopifyAdminAPI = axios.create({
  baseURL: `https://${SHOPIFY_STORE_URL.replace(/^https?:\/\//, '')}/admin/api/${API_VERSION}/graphql.json`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    'Content-Type': 'application/json',
  },
});

async function debugMetaobjects() {
  const query = `
    query($definitionId: ID!) {
      metaobjects(first: 20, definitionId: $definitionId) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      }
    }
  `;

  try {
    const response = await shopifyAdminAPI.post('', {
      query,
      variables: { definitionId }
    });

    console.log(JSON.stringify(response.data.data, null, 2));
  } catch (error) {
    console.error("❌ Errore debug Shopify:", error.message);
  }
}

debugMetaobjects();
