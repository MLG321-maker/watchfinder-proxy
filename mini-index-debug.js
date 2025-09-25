// mini-index-debug.js
// Mini server per testare ricerca e pagine orologi con sitemap e robots

const express = require("express");
const algoliasearch = require("algoliasearch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- Configurazioni da .env ---
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY;
const WATCH_INDEX_NAME = process.env.WATCH_INDEX_NAME;

if (!ALGOLIA_APP_ID || !ALGOLIA_API_KEY || !WATCH_INDEX_NAME) {
  console.error("❌ Mancano variabili Algolia (.env).");
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const watchIndex = client.initIndex(WATCH_INDEX_NAME);

// --- Funzione helper slugify ---
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// --- Route di test ricerca per reference ---
app.get("/test/:ref", async (req, res) => {
  const ref = req.params.ref.trim();
  console.log("📥 Richiesta ricevuta per reference:", ref);

  try {
    const result = await watchIndex.search("", {
      filters: `reference:${ref}`,
      hitsPerPage: 20,
    });

    if (!result.hits.length) {
      return res.send(`❌ Nessun risultato trovato per: ${ref}`);
    }

    console.log(`✅ Trovati ${result.hits.length} risultati per ${ref}`);
    const output = result.hits
      .map(
        (h, i) => `
#${i + 1} | Brand: ${h.brand} | Ref: ${h.reference}
   Family: ${h.family}
   Root: ${h.family_root}
   Lug: ${h.lug_width} | Diametro: ${h.diameter}
   Movimento: ${h.movement}
   Materiali: ${h.materials}`
      )
      .join("\n\n");

    res.type("text/plain").send(output);
  } catch (err) {
    console.error("❌ Errore in ricerca Algolia:", err);
    res.status(500).send("Errore in ricerca Algolia");
  }
});

// --- Robots.txt ---
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *
Disallow:

Sitemap: https://milanostraps.it/sitemap.xml`);
});

// --- Sitemap dinamica ---
app.get("/sitemap.xml", async (req, res) => {
  try {
    const hits = [];
    await watchIndex.browseObjects({
      query: "",
      batch: batch => {
        hits.push(...batch);
      },
    });

    const urls = hits.map(obj => {
      const brand = slugify(obj.brand || "modello");
      const ref = slugify(obj.reference || "sconosciuto");
      return `https://milanostraps.it/orologi/${brand}-${ref}`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `<url>
  <loc>${u}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>`
  )
  .join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("❌ Errore generazione sitemap:", err);
    res.status(500).send("Errore generazione sitemap");
  }
});

// --- Avvio server ---
app.listen(PORT, () => {
  console.log(`✅ Mini server avviato su http://localhost:${PORT}`);
  console.log(`👉 Prova con: http://localhost:${PORT}/test/116518LN`);
  console.log(`👉 Robots: http://localhost:${PORT}/robots.txt`);
  console.log(`👉 Sitemap: http://localhost:${PORT}/sitemap.xml`);
});