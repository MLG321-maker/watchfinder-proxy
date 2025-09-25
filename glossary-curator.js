// File: glossary-curator.js (Versione corretta e più robusta)
require('dotenv').config();
const algoliasearch = require('algoliasearch');
const OpenAI = require('openai');

// --- Configurazione ---
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const ALGOLIA_INDEX_NAME = "glossario"; // IMPORTANTE: Usiamo un nuovo indice per il glossario
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Inizializzazione dei client
const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// -------------------------------------------------------------------------
// ▼▼▼ INCOLLA QUI IL TESTO DA ANALIZZARE ▼▼▼
// -------------------------------------------------------------------------
const testoDaAnalizzare = `
  Il calibro di questo orologio è un movimento a carica automatica con una riserva di carica di 72 ore. 
  La cassa è realizzata in acciaio inossidabile 316L, noto per la sua resistenza alla corrosione. 
  Una caratteristica distintiva è la corona a vite, che garantisce un'impermeabilità fino a 200 metri. 
  Il quadrante è protetto da un vetro zaffiro con trattamento antiriflesso. A ore tre, troviamo il datario.
  Il cinturino in pelle di vitello pieno fiore è stato conciato al vegetale, un processo che utilizza tannini naturali.
`;
// -------------------------------------------------------------------------

async function suggestNewTerms() {
  console.log("🤖 Avvio del Curatore del Glossario...");

  // 1. Chiedi all'AI di estrarre i termini dal testo
  console.log("1. Analisi del testo da parte dell'AI per suggerire termini...");
  const prompt = `
    Sei un lessicografo esperto di orologeria e pelletteria di lusso.
    Analizza il testo fornito qui sotto e estrai una lista di termini tecnici o concetti importanti.
    Per ogni termine, fornisci una definizione chiara e concisa in italiano.

    REGOLE:
    - Ignora nomi di brand, modelli, e parole comuni non tecniche.
    - Concentrati su termini specifici del settore.
    - Restituisci un oggetto JSON con una singola chiave chiamata "termini", che contiene un array di oggetti.
    - Ogni oggetto nell'array deve avere due chiavi: "term" e "definition".
    - Esempio di formato: {"termini": [{"term": "Calibro", "definition": "Sinonimo di movimento..."}, {"term": "Corona a vite", "definition": "..."}]}

    Testo da analizzare:
    ---
    ${testoDaAnalizzare}
    ---
  `;
  
  let suggestedTerms = [];
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    const result = JSON.parse(response.choices[0].message.content);

    // --- CORREZIONE DI ROBUSTEZZA ---
    // Controlliamo che il risultato non sia nullo e che la lista esista
    if (result && result.termini && Array.isArray(result.termini)) {
        suggestedTerms = result.termini;
    } else {
        console.log("   -> L'AI non ha restituito termini validi nel formato atteso.");
        suggestedTerms = []; // Imposta un array vuoto per sicurezza
    }

  } catch (error) {
    console.error("❌ Errore durante l'analisi AI:", error.message);
    return;
  }
  console.log(`   -> AI ha suggerito ${suggestedTerms.length} termini.`);

  // 2. Scarica i termini già esistenti da Algolia
  console.log(`2. Controllo dei termini già presenti nell'indice "${ALGOLIA_INDEX_NAME}"...`);
  let existingTerms = new Set();
  try {
    await index.browseObjects({
      query: '',
      attributesToRetrieve: ['term'],
      batch: batch => {
        batch.forEach(hit => existingTerms.add(hit.term.toLowerCase()));
      }
    });
  } catch(e){
    if(e.message.includes("Index does not exist")){
        console.log("   -> L'indice del glossario non esiste ancora. Tutti i termini suggeriti sono considerati nuovi.");
    } else {
        console.error("❌ Errore Algolia:", e.message);
        return;
    }
  }
  console.log(`   -> Trovati ${existingTerms.size} termini esistenti.`);

  // 3. Filtra per trovare solo i termini veramente nuovi
  const newTerms = suggestedTerms.filter(
    suggested => !existingTerms.has(suggested.term.toLowerCase())
  );

  // 4. Mostra i risultati
  console.log("\n----------------------------------------------------");
  if (newTerms.length === 0) {
    console.log("✅ Nessun nuovo termine da suggerire per questo testo!");
  } else {
    console.log(`✨ Ecco ${newTerms.length} NUOVI termini suggeriti per il tuo glossario:`);
    newTerms.forEach(item => {
      console.log(`\n  - TERMINE: ${item.term}`);
      console.log(`    DEFINIZIONE: ${item.definition}`);
    });
  }
  console.log("----------------------------------------------------");
}

suggestNewTerms();