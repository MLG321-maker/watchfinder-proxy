require('dotenv').config();
const algoliasearch = require('algoliasearch');
const OpenAI = require('openai');

// --- Configurazione ---
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const GLOSSARY_INDEX_NAME = "glossario";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!ALGOLIA_ADMIN_KEY || !OPENAI_API_KEY) {
  console.error('❌ Errore: Assicurati che ALGOLIA_ADMIN_KEY e OPENAI_API_KEY siano nel file .env');
  process.exit(1);
}

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = algoliaClient.initIndex(GLOSSARY_INDEX_NAME);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function getAiDescription(term) {
  const prompt = `
    Sei un copywriter e storyteller del lusso per Milano Straps.
    Il termine del nostro glossario è "${term.term}". La sua definizione tecnica è: "${term.definition}".
    Espandi questa definizione in un paragrafo avvincente di circa 150 parole, in italiano.
    Il testo deve essere informativo ma anche evocativo, raccontando l'importanza o il fascino di questo concetto.
    Inizia in modo diretto, senza usare frasi come "Questo termine si riferisce a...".
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

async function generateAllDescriptions() {
  console.log(`🤖 Avvio arricchimento per l'indice "${GLOSSARY_INDEX_NAME}"...`);

  let hits = [];
  try {
    await index.browseObjects({
      query: '',
      filters: 'NOT description_ai',
      batch: batch => { hits = hits.concat(batch); }
    });
  } catch(e){
    console.error("❌ Errore Algolia:", e.message);
    return;
  }

  if (hits.length === 0) {
    console.log('✅ Tutti i termini hanno già una descrizione AI.');
    return;
  }

  console.log(`📄 Trovati ${hits.length} termini da arricchire. Inizio il processo...`);
  
  const recordsToUpdate = [];
  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    console.log(`[${i + 1}/${hits.length}] Genero descrizione per: ${hit.term}...`);
    
    const description = await getAiDescription(hit);

    if (description) {
      recordsToUpdate.push({
        objectID: hit.objectID, // È fondamentale includere l'objectID per l'aggiornamento
        description_ai: description,
      });
      console.log(`   -> Descrizione ricevuta.`);
    }
    if (i < hits.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (recordsToUpdate.length > 0) {
    console.log(`\n💾 Invio ${recordsToUpdate.length} aggiornamenti ad Algolia...`);
    try {
        // --- QUESTA È LA CORREZIONE FONDAMENTALE ---
        // partialUpdateObjects AGGIORNA i campi, non sostituisce l'intero record.
        await index.partialUpdateObjects(recordsToUpdate);
        console.log('✅ Aggiornamento completato con successo!');
    } catch (error) {
        console.error("❌ Errore durante l'aggiornamento su Algolia:", error.message);
    }
  }
}

generateAllDescriptions();
```

---
### ### Passo 2: Ripristiniamo i Dati Corrotti

Ora che lo script è sicuro, usiamo il Curatore per reinserire i dati corretti.

1.  **Cancella i Record Danneggiati:** Vai sulla dashboard di Algolia, nell'indice `glossario`, e cancella i record a cui mancano i campi.
2.  **Usa il Curatore:** Torna sulla tua interfaccia `/curator`.
3.  **Analizza di nuovo** il testo o l'URL da cui avevi estratto i termini.
4.  **Approva e Salva** di nuovo i termini. Questo li ricreerà su Algolia con tutti i campi corretti (`term`, `definition`, `category`, `meta_description`).

---
### ### Passo 3: Lancia lo Script Corretto

Una volta che i dati di base sono di nuovo su Algolia, puoi finalmente lanciare lo script corretto per arricchirli.

1.  Vai nel terminale.
2.  Esegui il comando:
    ```bash
    node generate-glossary-descriptions.js
    

