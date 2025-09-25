import dotenv from "dotenv";
import algoliasearch from "algoliasearch";

dotenv.config();

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);

const watchIndex = client.initIndex("watchdatabase1");

async function run() {
  console.log("📥 Ispezione dei primi 20 oggetti dell’indice watchdatabase1...\n");
  let count = 0;
  await watchIndex.browseObjects({
    batch: batch => {
      batch.forEach(hit => {
        console.log(`#${++count} ------------------`);
        console.log("ObjectID:", hit.objectID);
        console.log("Reference:", hit.reference);
        console.log("Name:", hit.Name);
        console.log("Brand:", hit.Brand);
        console.log("Campi disponibili:", Object.keys(hit));
        console.log();
      });
    },
    hitsPerPage: 20
  });
}

run().catch(console.error);