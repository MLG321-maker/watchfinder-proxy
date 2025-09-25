import express from "express";
import algoliasearch from "algoliasearch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const app = express();
const PORT = 4000;

// 🔑 Connessione ad Algolia
const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);

const watchIndex = client.initIndex(process.env.WATCH_INDEX_NAME);

// 🟢 Sitemap dinamica
app.get("/sitemap.xml", async (req, res) => {
  try {
    console.log("📥 Generazione sitemap da Algolia:", process.env.WATCH_INDEX_NAME);

    // recuperiamo max 30.000 record
    const { hits } = await watchIndex.search("", { hitsPerPage: 30000 });

    if (!hits || hits.length === 0) {
      return res.status(404).send("❌ Nessun record trovato");
    }

    // suddividiamo in blocchi da 5000
    const size = 5000;
    const chunks = [];
    for (let i = 0; i < hits.length; i += size) {
      chunks.push(hits.slice(i, i + size));
    }

    // salviamo i file delle sottositemap
    chunks.forEach((chunk, idx) => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunk
  .map(
    (hit) => `
  <url>
    <loc>https://milanostraps.it/orologi/${hit.brand?.toLowerCase() || "brand"}-${hit.reference?.toLowerCase() || "ref"}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
      fs.writeFileSync(`sitemap-${idx + 1}.xml`, xml);
    });

    // generiamo l’indice
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks
  .map(
    (_, idx) => `
  <sitemap>
    <loc>https://milanostraps.it/sitemap-${idx + 1}.xml</loc>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

    res.header("Content-Type", "application/xml");
    res.send(indexXml);
  } catch (err) {
    console.error("❌ Errore generazione sitemap:", err);
    res.status(500).send("Errore generazione sitemap");
  }
});

// 🟢 Avvio server
app.listen(PORT, () => {
  console.log(`✅ Mini server avviato su http://localhost:${PORT}`);
  console.log(`👉 Prova sitemap: http://localhost:${PORT}/sitemap.xml`);
});