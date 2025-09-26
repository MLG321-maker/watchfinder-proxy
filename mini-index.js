const express = require("express");
const algoliasearch = require("algoliasearch");
const path = require("path");
require("dotenv").config();

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_KEY,
  ALGOLIA_INDEX_NAME
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("❌ Mancano variabili Algolia (.env).");
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.send("Server attivo");
});

app.get("/orologi/:slug", async (req, res) => {
  const reference = req.params.slug;

  try {
    const result = await index.search(reference, {
      restrictSearchableAttributes: ["reference"],
      hitsPerPage: 1
    });

    if (result.hits.length === 0) {
      res.status(404).send("Orologio non trovato");
    } else {
      const watch = result.hits[0];
      res.render("watch", { watch });
    }
  } catch (err) {
    console.error("❌ Errore in ricerca Algolia:", err);
    res.status(500).send("Errore server");
  }
});

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});