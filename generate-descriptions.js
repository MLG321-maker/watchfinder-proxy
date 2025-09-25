// File: generate-descriptions.js (Versione con prompt V3)
require('dotenv').config();
const algoliasearch = require('algoliasearch');
const OpenAI = require('openai');

// --- Configurazione ---
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validazione delle chiavi
if (!ALGOLIA_ADMIN_KEY || !OPENAI_API_KEY) {
  console.error('❌ Errore: Assicurati di aver configurato ALGOLIA_ADMIN_KEY e OPENAI_API_KEY nel file .env');
  process.exit(1);
}

// Inizializzazione dei client
const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- Funzione per generare la descrizione AI ---
async function getAiDescription(hit) {
  // PROMPT V3 - "ANTI-VARIANTI" E "ANTI-CLICHÉ"
  const prompt = `
    Sei un copywriter esperto di orologeria e storyteller del lusso per Milano Straps.
    Scrivi una descrizione avvincente, unica e informativa per il seguente orologio, in italiano, massimo 150 parole.

    Dati dell'orologio:
    - Marca: ${hit.brand || ''}
    - Famiglia: ${hit.family || hit.family_root || ''}
    - Referenza: ${hit.reference || ''}
    - Nome Modello: ${hit.name || ''}
    - Materiali: ${hit.materials || ''}
    - Movimento: ${hit.movement || ''}

    ---
    **REGOLE FONDAMENTALI (SEGUILE ALLA LETTERA):**

    1.  **SULL'APERTURA (MOLTO IMPORTANTE):**
        * **NON USARE MAI FRASI GENERICHE E ABUSATE** come "Nel cuore dell'orologeria...", "Simbolo di eleganza...", o frasi simili.
        * **INIZIA LA DESCRIZIONE IN MODO DIRETTO E SPECIFICO.** Usa uno di questi approcci:
            * Parti dalla sua funzione originale (Es. "Nato per le profondità marine...")
            * Parti da un dettaglio iconico (Es. "La sua celebre ghiera bicolore...")
            * Parti da un contesto storico (Es. "Nel 1969, al polso degli astronauti...")

    2.  **SUL CONTENUTO:**
        * La descrizione deve essere **generale** e valida per tutte le versioni di questa referenza.
        * **NON menzionare dettagli variabili** come il colore specifico del quadrante o la presenza di diamanti.
        * Concentrati sugli elementi comuni: la storia, il design, il calibro e lo spirito dell'orologio.
    ---
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`❌ Errore API OpenAI per ${hit.reference}:`, error.message);
    return null;
  }
}

// --- Funzione Principale ---
async function generateAllDescriptions() {
  console.log(`🤖 Avvio generatore di descrizioni per l'indice "${ALGOLIA_INDEX_NAME}"...`);

  let hits = [];
  try {
    await index.browseObjects({
      query: '',
      filters: 'NOT description_ai',
      attributesToRetrieve: ['objectID', 'brand', 'family', 'family_root', 'reference', 'name', 'materials', 'movement'],
      batch: batch => { hits = hits.concat(batch); }
    });
  } catch(e){
    console.error("ERRORE ALGOLIA", e.message);
    return;
  }

  if (hits.length === 0) {
    console.log('✅ Tutti i record hanno già una descrizione AI. Nessun lavoro da fare!');
    return;
  }

  console.log(`📄 Trovati ${hits.length} orologi senza descrizione. Inizio il processo...`);
  
  // Per TESTARE solo sui primi 5 record, assicurati che questa riga sia attiva (senza //)
  //hits = hits.slice(0, 5);

  const recordsToUpdate = [];
  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    console.log(`[${i + 1}/${hits.length}] Genero descrizione per: ${hit.brand} ${hit.reference}...`);
    
    const description = await getAiDescription(hit);

    if (description) {
      recordsToUpdate.push({
        objectID: hit.objectID,
        description_ai: description,
      });
      console.log(`   -> Descrizione ricevuta.`);
    }

    if (i < hits.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (recordsToUpdate.length > 0) {
    console.log(`\n💾 Invio ${recordsToUpdate.length} nuove descrizioni ad Algolia...`);
    try {
        await index.partialUpdateObjects(recordsToUpdate);
        console.log('✅ Aggiornamento completato con successo!');
    } catch (error) {
        console.error("❌ Errore durante l'aggiornamento su Algolia:", error.message);
    }
  }
}

// Avvia lo script
generateAllDescriptions();