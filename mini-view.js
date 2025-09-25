// mini-view.js
const express = require("express");
const algoliasearch = require("algoliasearch");
require("dotenv").config();

const app = express();
const PORT = 4000;

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY // usa admin per comodità
);

const index = client.initIndex("watchdatabase1");

app.get("/test/:ref", async (req, res) => {
  const reference = req.params.ref.trim();
  console.log("📥 Richiesta ricevuta per reference:", reference);

  try {
    const result = await index.search("", {
      filters: `reference:"${reference}"`,
      hitsPerPage: 50,
    });

    if (!result.hits || result.hits.length === 0) {
      return res.send(`<h2>❌ Nessun risultato trovato per: ${reference}</h2>`);
    }

    let html = `
      <h1>Risultati per ${reference}</h1>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr>
          <th>#</th><th>Brand</th><th>Ref</th><th>Family</th><th>Root</th>
          <th>Lug</th><th>Diametro</th><th>Movimento</th><th>Materiali</th>
        </tr>
    `;

    result.hits.forEach((hit, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${hit.brand || "—"}</td>
          <td>${hit.reference || "—"}</td>
          <td>${hit.family || "—"}</td>
          <td>${hit.family_root || "—"}</td>
          <td>${hit.lug_width || "—"}</td>
          <td>${hit.diameter || "—"}</td>
          <td>${hit.movement || "—"}</td>
          <td>${hit.materials || "—"}</td>
        </tr>
      `;
    });

    html += "</table>";
    res.send(html);
  } catch (err) {
    console.error("❌ Errore Algolia:", err.message);
    res.status(500).send("Errore durante la query Algolia.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Mini server avviato su http://localhost:${PORT}`);
  console.log(`👉 Prova con: http://localhost:${PORT}/test/116518LN`);
});