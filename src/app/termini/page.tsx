import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { businessEnv, getPricing } from "@/lib/env";

export const metadata: Metadata = { title: "Termini di servizio" };

export default function TermsPage() {
  const b = { name: businessEnv.name(), legal: businessEnv.legalName(), address: businessEnv.address(), vat: businessEnv.vat(), email: businessEnv.supportEmail() };
  const p = getPricing();
  const eur = (c: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: p.currency.toUpperCase() }).format(c / 100);
  return (
    <LegalLayout title="Termini di servizio" updated="Ultimo aggiornamento: 8 ottobre 2026" supportEmail={b.email} businessName={b.name}>
      <h2>1. Il servizio</h2>
      <p>
        {BRAND} (&quot;Servizio&quot;) è un&apos;applicazione web fornita da <strong>{b.legal}</strong> ({b.address}, P. IVA {b.vat}) che consente di creare preventivi e di
        esportarli in formato PDF. L&apos;uso del Servizio implica l&apos;accettazione dei presenti Termini.
      </p>
      <h2>2. Piani e prezzi</h2>
      <ul>
        <li>
          <strong>Gratuito</strong>: creazione illimitata di preventivi, anteprima e PDF con filigrana.
        </li>
        <li>
          <strong>Singolo</strong> ({eur(p.single)} una tantum): sblocca il download senza filigrana del singolo preventivo, incluse le sue modifiche successive.
        </li>
        <li>
          <strong>Pro</strong> ({eur(p.proMonthly)} al mese oppure {eur(p.proYearly)} all&apos;anno): download illimitati senza filigrana per la durata dell&apos;abbonamento, che si
          rinnova automaticamente fino a disdetta dal portale Stripe.
        </li>
      </ul>
      <p>I prezzi sono indicati IVA inclusa, ove applicabile. I pagamenti sono gestiti da Stripe; non trattiamo i dati della carta.</p>
      <h2>3. Diritto di recesso e rimborsi</h2>
      <p>
        Il contenuto digitale viene fornito immediatamente dopo il pagamento. Richiedendo il download il consumatore acconsente espressamente all&apos;esecuzione immediata e prende atto
        della perdita del diritto di recesso (art. 59, lett. o, D.Lgs. 206/2005). Se il PDF non viene generato correttamente per un problema tecnico imputabile a noi, rimborsiamo
        l&apos;importo: scrivi a <a href={`mailto:${b.email}`}>{b.email}</a> entro 14 giorni.
      </p>
      <h2>4. Responsabilità dell&apos;utente</h2>
      <p>
        L&apos;utente è l&apos;unico responsabile dei contenuti inseriti nei preventivi e della loro correttezza, anche fiscale. Il Servizio applica calcoli standard (IVA, rivalsa INPS,
        ritenuta d&apos;acconto, imposta di bollo, regime forfettario) a titolo di ausilio e non costituisce consulenza fiscale o legale.
      </p>
      <h2>4-bis. Invio al cliente e accettazione online</h2>
      <p>
        L&apos;utente può generare un link pubblico al preventivo e inviarlo a chi preferisce; è responsabile della diffusione del link e dei contenuti condivisi. Il destinatario può
        accettare o rifiutare il preventivo indicando il proprio nome: il Servizio registra la decisione con data, ora e un identificativo tecnico della connessione e ne dà notizia al
        mittente. Tale registrazione costituisce una prova dell&apos;accettazione tra le parti ma non una firma elettronica qualificata; per contratti che richiedono forme particolari
        l&apos;utente deve provvedere con gli strumenti previsti dalla legge. I link scadono dopo 12 mesi o quando l&apos;utente li disattiva.
      </p>
      <h2>5. Dati e disponibilità</h2>
      <p>
        I preventivi sono salvati nel browser dell&apos;utente, che è responsabile del loro backup. Ci impegniamo a mantenere il Servizio disponibile ma non garantiamo l&apos;assenza di
        interruzioni. La chiave di licenza Pro è personale e non cedibile.
      </p>
      <h2>6. Limitazione di responsabilità</h2>
      <p>
        Nei limiti consentiti dalla legge, la nostra responsabilità complessiva è limitata all&apos;importo pagato dall&apos;utente nei 12 mesi precedenti l&apos;evento che ha originato la
        richiesta.
      </p>
      <h2>7. Legge applicabile e foro</h2>
      <p>I presenti Termini sono regolati dalla legge italiana. Per i consumatori è competente il foro del luogo di residenza; negli altri casi il foro della sede del fornitore.</p>
      <h2>8. Contatti</h2>
      <p>
        Per qualsiasi richiesta: <a href={`mailto:${b.email}`}>{b.email}</a>.
      </p>
    </LegalLayout>
  );
}
