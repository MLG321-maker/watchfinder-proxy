// dump-watches.js
import dotenv from "dotenv";
import algoliasearch from "algoliasearch";

dotenv.config();

console.log("🔑 APP_ID:", process.env.ALGOLIA_APP_ID);
console.log("🔑 ADMIN_KEY in uso:", (process.env.ALGOLIA_ADMIN_KEY || "").slice(0, 8) + "...");

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY   // Admin Key per test
);

const watchIndex = client.initIndex("watchdatabase1");

async function run() {
  console.log("📥 Tentativo lettura da indice watchdatabase1...\n");
  let count = 0;
  try {
    await watchIndex.browseObjects({
      batch: batch => {
        batch.forEach(hit => {
          console.log(`#${++count} ------------------`);
          console.log("objectID:", hit.objectID);
          console.log("reference:", hit.reference);
          console.log("brand:", hit.Brand);
          console.log("name:", hit.Name);
        });
      },
      hitsPerPage: 5
    });
    console.log("✅ Fine lettura, oggetti stampati:", count);
  } catch (err) {
    console.error("❌ Errore browseObjects:", err);
  }
}

run();