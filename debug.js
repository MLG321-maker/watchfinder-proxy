// debug.js
console.log("🔎 Variabili disponibili su Vercel:");
[
  "ALGOLIA_APP_ID",
  "ALGOLIA_ADMIN_KEY",
  "ALGOLIA_API_KEY",
  "WATCH_INDEX_NAME",
  "GLOSSARY_INDEX_NAME",
  "SHOPIFY_STORE_URL",
  "SHOPIFY_ADMIN_TOKEN",
  "OPENAI_API_KEY",
  "API_VERSION",
  "ENABLE_ENRICH",
  "NODE_ENV",
  "PORT"
].forEach(key => {
  if (process.env[key]) {
    console.log(`✅ ${key} = ${process.env[key].slice(0, 8)}...`); // stampa solo i primi caratteri
  } else {
    console.log(`❌ ${key} = MANCANTE`);
  }
});
