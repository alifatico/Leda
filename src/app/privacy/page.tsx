import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { businessEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  const b = { name: businessEnv.name(), legal: businessEnv.legalName(), address: businessEnv.address(), vat: businessEnv.vat(), email: businessEnv.supportEmail() };
  return (
    <LegalLayout title="Privacy policy" updated="Ultimo aggiornamento: 8 ottobre 2026" supportEmail={b.email} businessName={b.name}>
      <p>
        Questa informativa descrive come <strong>{b.legal}</strong> ({b.address}, P. IVA {b.vat}), titolare del trattamento, tratta i dati personali degli utenti del servizio
        {BRAND} ai sensi del Regolamento (UE) 2016/679 (GDPR).
      </p>
      <h2>1. Dati trattati e finalità</h2>
      <ul>
        <li>
          <strong>Contenuto dei preventivi</strong> (dati del mittente, del cliente, voci, importi, logo): viene salvato esclusivamente nel browser dell&apos;utente (localStorage). Viene
          trasmesso ai nostri server solo nel momento in cui l&apos;utente richiede la generazione del PDF o della bozza con AI e viene elaborato in memoria senza essere conservato.
        </li>
        <li>
          <strong>Bozza con AI</strong>: la descrizione del lavoro inserita dall&apos;utente viene inviata ad Anthropic (fornitore del modello linguistico) per produrre la bozza; non vengono
          inviati i dati del cliente né quelli del mittente.
        </li>
        <li>
          <strong>Ricerca nel Registro Imprese</strong>: se attiva, la ragione sociale o la partita IVA digitata nel campo cliente viene inviata al fornitore configurato, Openapi
          S.p.A. (Roma) oppure Apify Technologies s.r.o. (Praga, UE), che raccoglie i dati pubblici del Registro Imprese per proporre i dati anagrafici dell&apos;impresa; non viene
          inviato nessun altro contenuto del preventivo e le ricerche non vengono conservate oltre il tempo necessario a rispondere.
        </li>
        <li>
          <strong>Pagamenti</strong>: sono gestiti da Stripe Payments Europe Ltd. Noi non riceviamo né conserviamo i dati della carta; riceviamo da Stripe l&apos;esito del pagamento, l&apos;email
          di fatturazione e gli identificativi della transazione, necessari per fornire il servizio acquistato e per gli obblighi fiscali.
        </li>
        <li>
          <strong>Chiave di licenza Pro</strong>: è un token firmato che contiene gli identificativi dell&apos;abbonamento Stripe e, se disponibile, l&apos;email di fatturazione. Viene salvato nel
          browser dell&apos;utente e, su richiesta dell&apos;utente, inviato via email tramite il fornitore Resend.
        </li>
        <li>
          <strong>Invio al cliente</strong>: se l&apos;utente sceglie di inviare un preventivo con link, una copia del documento (dati del mittente, del destinatario, voci, importi e logo) viene
          salvata sui nostri server per 12 mesi o fino alla disattivazione del link da parte dell&apos;utente. Chi riceve il link può accettare o rifiutare il preventivo: in tal caso
          registriamo nome, eventuale nota, data e ora e un identificativo tecnico derivato dall&apos;indirizzo IP (hash giornaliero, non reversibile), e inviamo un avviso via email al
          mittente. L&apos;archiviazione avviene su Upstash (Redis gestito) nella regione scelta in fase di configurazione.
        </li>
        <li>
          <strong>Dati tecnici</strong>: indirizzo IP e dati di navigazione sono trattati temporaneamente per la sicurezza del servizio (limitazione delle richieste) e, se attive, per
          statistiche aggregate e anonime (Plausible Analytics, senza cookie).
        </li>
      </ul>
      <h2>2. Base giuridica</h2>
      <p>
        Esecuzione del contratto (art. 6.1.b GDPR) per la generazione dei documenti e i pagamenti; obbligo legale (art. 6.1.c) per la conservazione dei dati fiscali; legittimo interesse
        (art. 6.1.f) per la sicurezza e le statistiche aggregate.
      </p>
      <h2>3. Conservazione</h2>
      <p>
        I contenuti dei preventivi non sono conservati sui nostri server, salvo quelli inviati con link (12 mesi o fino alla disattivazione). I dati relativi ai pagamenti sono conservati da Stripe e nella nostra contabilità per il periodo previsto dalla
        legge (10 anni). I log tecnici sono conservati per un massimo di 30 giorni.
      </p>
      <h2>4. Destinatari e trasferimenti</h2>
      <p>
        Fornitori di servizi che agiscono come responsabili del trattamento: Vercel (hosting), Stripe (pagamenti), Anthropic (bozza con AI), Resend (email), Upstash (archiviazione dei
        preventivi inviati con link), Openapi o Apify (ricerca nel Registro Imprese, a seconda della configurazione). Alcuni fornitori possono
        trattare dati al di fuori dell&apos;UE sulla base delle Clausole Contrattuali Standard o del Data Privacy Framework.
      </p>
      <h2>5. Cookie e archiviazione locale</h2>
      <p>
        Il servizio non utilizza cookie di profilazione. Utilizza il localStorage del browser per salvare i preventivi, le preferenze e la chiave di licenza; questi dati restano sul
        dispositivo dell&apos;utente e possono essere cancellati in qualsiasi momento dalle impostazioni del browser. Stripe può impostare cookie tecnici durante il pagamento.
      </p>
      <h2>6. Diritti dell&apos;interessato</h2>
      <p>
        L&apos;utente può esercitare i diritti di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione scrivendo a <a href={`mailto:${b.email}`}>{b.email}</a>, e
        proporre reclamo al Garante per la protezione dei dati personali.
      </p>
      <h2>7. Modifiche</h2>
      <p>Eventuali modifiche a questa informativa saranno pubblicate su questa pagina con la data di aggiornamento.</p>
    </LegalLayout>
  );
}
