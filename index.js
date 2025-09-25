// index.js
// Milano Straps — Applicazione di Gestione Contenuti
// Avvio: node index.js  (porta 5501)

const path = require('path');
try {
  if (!process.env.VERCEL) {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
  }
} catch (_) {}

const express = require('express');
const algoliasearch = require('algoliasearch');
const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const { ApiVersion } = require('@shopify/shopify-api');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const PORT = process.env.PORT || 5501;
app.set('trust proxy', true);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Configurazione ---
const {
    ALGOLIA_APP_ID,
    ALGOLIA_ADMIN_KEY,
    WATCH_INDEX_NAME,
    GLOSSARY_INDEX_NAME,
    SHOPIFY_STORE_URL,
    SHOPIFY_ADMIN_TOKEN,
    OPENAI_API_KEY
} = process.env;

const API_VERSION = "2025-07";

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY || !OPENAI_API_KEY || !SHOPIFY_ADMIN_TOKEN || !SHOPIFY_STORE_URL) {
  console.error('❌ ERRORE: Config mancante. Controlla tutte le chiavi API nel file .env');
  process.exit(1);
}

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const watchIndex = algoliaClient.initIndex(WATCH_INDEX_NAME || "watchdatabase1");

// ──────────────────────────────────────────────────────────────
// Utility e Layout HTML (per Watchfinder)
// ──────────────────────────────────────────────────────────────
const gold = '#8c6239';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
function titleCase(s){
  return String(s || '').split(' ')
    .map(w => (w ? (w[0].toUpperCase() + w.slice(1)) : ''))
    .join(' ');
}
function mmClean(value) {
  if (!value) return null;
  const clean = String(value).replace(/[,]/g, '.').replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return String(num).replace(/\.0+$/,'').replace(/(\.\d*[1-9])0+$/,'$1');
}
function strapCollectionUrl(lugWidth) {
  const w = mmClean(lugWidth);
  if (!w) return null;
  const base = 'https://milanostraps.it/collections';
  const allowed = {
    '16': `${base}/cinturini-orologi-per-misura-ansa-16mm`,
    '18': `${base}/cinturini-orologi-per-misura-ansa-18mm`,
    '19': `${base}/cinturini-orologi-per-misura-ansa-19mm`,
    '20': `${base}/cinturini-orologi-per-misura-ansa-20mm`,
    '21': `${base}/cinturini-orologi-per-misura-ansa-21mm`,
    '22': `${base}/cinturini-orologi-per-misura-ansa-22mm`,
    '24': `${base}/cinturini-orologi-per-misura-ansa-24mm`,
  };
  return allowed[w] || null;
}
function modelPermalink(hit) {
  if (!hit) return '';
  const parts = [hit.brand, hit.family_root, hit.reference]
    .map(part => slugify(part))
    .filter(Boolean);
  if (parts.length === 0) return '/orologi/modello-sconosciuto';
  return `/orologi/${parts.join('-')}`;
}
function filterEq(attr, val) {
  return `${attr}:${JSON.stringify(String(val))}`;
}
// ──────────────────────────────────────────────────────────────
// Routes Pubbliche
// ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('<h1>Benvenuto</h1><p><a href="/dashboard">Vai alla Centrale di Comando</a></p><p><a href="/orologi/rolex-116518ln">Esempio Watchfinder</a></p>');
});
app.get('/curator', (req, res) => { res.sendFile(path.join(__dirname, 'curator.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'dashboard.html')); });

// =========================
// Route pagina orologio SEO
// =========================
app.get('/orologi/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    console.log("📥 Richiesta ricevuta per:", slug);

    // Estrai brand e referenza
    const parts = slug.split("-");
    const brand = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const referenceCandidate = parts[parts.length - 1].toUpperCase();

    console.log("🔎 Reference candidate:", referenceCandidate);

    // Cerca orologio principale
    const mainSearch = await watchIndex.search(referenceCandidate, {
      filters: `reference:"${referenceCandidate}"`,
      hitsPerPage: 1
    });

    if (mainSearch.hits.length === 0) {
      return res.status(404).send("❌ Modello non trovato");
    }

    const watch = mainSearch.hits[0];

    // Recupera le referenze collegate usando family_root
    const relatedSearch = await watchIndex.search("", {
      filters: `brand:"${watch.brand}" AND family_root:"${watch.family_root}"`,
      hitsPerPage: 100
    });

    const relatedRefs = [...new Set(
      relatedSearch.hits.map(hit => hit.reference).filter(ref => ref !== referenceCandidate)
    )].sort();

    // Genera descrizione AI (fallback se manca)
    let aiDescription = watch.description;
    if (!aiDescription || aiDescription.trim() === "") {
      aiDescription = `Il modello ${watch.brand} ${watch.family || ''} referenza ${watch.reference} 
      rappresenta uno degli orologi più iconici della sua categoria. Dotato di calibro ${watch.movement || '-'}, 
      con cassa da ${watch.diameter || '-'} mm e anse ${watch.lug_width || '-'} mm, 
      coniuga materiali come ${watch.materials || '—'} e stile senza tempo.`;
    }

    // Renderizza la pagina con EJS
    res.render("watch", {
      brand: watch.brand || brand,
      family: watch.family || "",
      reference: watch.reference || referenceCandidate,
      diameter: watch.diameter || "",
      lug_width: watch.lug_width || "",
      movement: watch.movement || "",
      materials: watch.materials || "",
      description: aiDescription,
      relatedRefs
    });

  } catch (error) {
    console.error("❌ Errore in /orologi/:slug", error);
    res.status(500).send("Errore interno");
  }
});
// ──────────────────────────────────────────────────────────────
// API per il Curatore del Glossario
// ──────────────────────────────────────────────────────────────
async function getAiEnrichment(term) {
  const prompt = `
    Sei un copywriter e storyteller del lusso per Milano Straps.
    Il termine del nostro glossario è "${term.term}". La sua definizione tecnica è: "${term.definition}".
    Espandi questa definizione in un paragrafo avvincente di circa 150 parole, in italiano.
  `;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`❌ Errore OpenAI per "${term.term}":`, error.message);
    return null;
  }
}

app.post('/api/suggest-terms', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Testo mancante' });
  try {
    const categories = ["Orologeria", "Componenti", "Pelletteria", "Materiali", "Misurazioni", "Storia e Cultura"];
    const prompt = `
      Analizza il testo ed estrai termini tecnici. Restituisci JSON con:
      - term
      - definition
      - category (da: ${categories.join(', ')})
      - meta_description (max 155 caratteri).
      Testo: --- ${text} ---
    `;
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    const result = JSON.parse(aiResponse.choices[0].message.content);
    res.json({ newTerms: result.termini || [] });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante analisi', details: error.message });
  }
});

app.post('/api/save-terms', async (req, res) => {
  const { terms } = req.body;
  if (!terms || !Array.isArray(terms) || terms.length === 0) {
    return res.status(400).json({ error: 'Nessun termine da salvare' });
  }
  try {
    console.log(`🔥 Arricchimento per ${terms.length} termini...`);
    const enriched = [];
    for (const term of terms) {
      const description_ai = await getAiEnrichment(term);
      enriched.push({ ...term, description_ai: description_ai || "" });
      await new Promise(r => setTimeout(r, 1000));
    }
    const glossaryIndex = algoliaClient.initIndex(GLOSSARY_INDEX_NAME || "glossario");
    await glossaryIndex.saveObjects(enriched, { autoGenerateObjectIDIfNotExist: true });
    res.json({ success: true, message: `${enriched.length} termini salvati.` });
  } catch (error) {
    res.status(500).json({ error: 'Errore salvataggio Algolia', details: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// Sync con Shopify
// ──────────────────────────────────────────────────────────────
const shopifyAdminAPI = axios.create({
  baseURL: `https://${SHOPIFY_STORE_URL.replace(/^https?:\/\//, '')}/admin/api/${API_VERSION}/graphql.json`,
  headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN, 'Content-Type': 'application/json' },
});

async function makeShopifyRequest(query, variables = {}) {
  try {
    const response = await shopifyAdminAPI.post('', { query, variables });
    if (response.data.errors) throw new Error(JSON.stringify(response.data.errors, null, 2));
    return response.data;
  } catch (error) {
    console.error("❌ Errore GraphQL Shopify:", error.message);
    throw error;
  }
}

app.post('/api/sync-shopify', async (req, res) => {
  console.log("🚀 Richiesta di sincronizzazione con Shopify ricevuta...");
  try {
    const glossaryIndex = algoliaClient.initIndex(GLOSSARY_INDEX_NAME || "glossario");
    let allTerms = [];
    await glossaryIndex.browseObjects({ batch: b => { allTerms = allTerms.concat(b); } });
    if (allTerms.length === 0) return res.json({ message: 'Nessun termine da sincronizzare.' });

    const defQuery = `query { metaobjectDefinitions(first: 50) { edges { node { id type name } } } }`;
    const defResponse = await makeShopifyRequest(defQuery);
    const definitions = defResponse.data.metaobjectDefinitions.edges.map(e => e.node);
    const definitionInfo = definitions.find(d => d.name === "Termine Glossario");
    if (!definitionInfo) throw new Error("Definizione Metaobject 'Termine Glossario' non trovata.");

    let successCount = 0;
    for (const term of allTerms) {
      if (!term.term) continue;
      const handle = slugify(term.term);
      const mutation = `
        mutation upsert($handle: String!, $metaobject: MetaobjectUpsertInput!) {
          metaobjectUpsert(handle: {handle: $handle, type: "${definitionInfo.type}"}, metaobject: $metaobject) {
            metaobject { id } userErrors { field message }
          }
        }`;
      const variables = {
        handle,
        metaobject: { fields: [
          { key: "term", value: term.term || "" },
          { key: "definition", value: term.definition || "" },
          { key: "description_ai", value: term.description_ai || "" },
          { key: "category", value: term.category || "" },
          { key: "meta_description", value: term.meta_description || "" }
        ]}
      };
      try {
        const response = await makeShopifyRequest(mutation, variables);
        if (response.data.metaobjectUpsert.userErrors.length === 0) successCount++;
      } catch(e) { console.error(`Errore sync "${term.term}":`, e.message); }
    }
    res.json({ message: 'Success', details: `${successCount}/${allTerms.length} termini sincronizzati.` });
  } catch (error) {
    res.status(500).json({ message: 'Errore sync Shopify', error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// Pulizia referenze (deduplica)
// ──────────────────────────────────────────────────────────────
app.post('/api/clean-watches', async (req, res) => {
  console.log("🧹 Pulizia referenze avviata...");
  try {
    const hits = [];
    await watchIndex.browseObjects({ batch: b => hits.push(...b) });
    const recordsToUpdate = [];
    for (const hit of hits) {
      if (typeof hit.reference === 'string') {
        const cleaned = hit.reference.replace(/-0+\d+$/, '').trim();
        if (cleaned !== hit.reference) {
          recordsToUpdate.push({ ...hit, reference: cleaned });
        }
      }
    }
    if (recordsToUpdate.length > 0) {
      await watchIndex.saveObjects(recordsToUpdate);
    }
    res.json({ message: 'Success', details: `${recordsToUpdate.length} referenze pulite.` });
  } catch (error) {
    res.status(500).json({ message: 'Errore pulizia referenze', error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// Avvio server
// ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server e Centrale di Comando avviati su http://localhost:${PORT}`);
  console.log(`   -> Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   -> Curatore: http://localhost:${PORT}/curator`);
});