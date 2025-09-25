    // test-env.js
require('dotenv').config();

console.log("🔎 Test variabili ambiente...");
console.log("SHOPIFY_STORE_URL =", process.env.SHOPIFY_STORE_URL || "❌ NON TROVATO");
console.log("SHOPIFY_ADMIN_API_KEY =", process.env.SHOPIFY_ADMIN_API_KEY ? "✅ TROVATO" : "❌ NON TROVATO");
