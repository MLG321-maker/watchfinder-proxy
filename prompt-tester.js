// File: prompt-tester.js
require('dotenv').config();
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Errore: Manca la OPENAI_API_KEY nel file .env');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// -------------------------------------------------------------------------
// ▼▼▼ PUOI MODIFICARE TUTTO QUELLO CHE C'È QUI SOTTO ▼▼▼
// -------------------------------------------------------------------------

// 1. I DATI DELL'OROLOGIO PER IL TEST
// Cambia questi dati per testare il prompt su orologi diversi.
const orologioDiTest = {
  brand: "Tudor",
  family: "Black Bay",
  reference: "79683",
  materials: "Acciaio e Oro",
  movement: "Calibro MT5601",
};

// 2. IL PROMPT DA PERFEZIONARE
// Questo è il cuore del test. Modifica il testo qui per vedere risultati diversi.
const promptDaTestare = `
  Sei un copywriter esperto di orologeria e storyteller del lusso per Milano Straps.
  Scrivi una descrizione avvincente, unica e informativa per il seguente orologio, in italiano, massimo 150 parole.

  Dati dell'orologio:
  - Marca: ${orologioDiTest.brand || ''}
  - Famiglia: ${orologioDiTest.family || ''}
  - Referenza: ${orologioDiTest.reference || ''}
  - Materiali: ${orologioDiTest.materials || ''}
  - Movimento: ${orologioDiTest.movement || ''}

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

// -------------------------------------------------------------------------
// ▲▲▲ NON MODIFICARE IL CODICE QUI SOTTO ▲▲▲
// -------------------------------------------------------------------------

async function eseguiTest() {
  console.log("🚀 Invio del prompt all'AI per il modello di test...");
  console.log("----------------------------------------------------");
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: promptDaTestare }],
      max_tokens: 300,
    });
    const descrizione = response.choices[0].message.content.trim();
    console.log("✅ DESCRIZIONE RICEVUTA:\n");
    console.log(descrizione);
    console.log("----------------------------------------------------");
  } catch (error) {
    console.error("❌ Errore durante la chiamata all'AI:", error.message);
  }
}

eseguiTest();