import React from "react";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { BRAND } from "@/lib/brand";
import {
  addressLines,
  computeTotals,
  formatDate,
  formatMoney,
  formatNumber,
  formatPct,
  resolveDesign,
  rivalsaCaption,
  validUntil,
  type DocLabels,
  type Party,
  type Quote,
  type ResolvedDesign,
} from "@/lib/quote";
import { sanitizeForPdf as s } from "./sanitize";

// Italian words break badly with the default English hyphenator.
Font.registerHyphenationCallback((word) => [word]);

const GRAY_900 = "#111827";
const GRAY_600 = "#4B5563";
const GRAY_400 = "#9CA3AF";
const GRAY_200 = "#E5E7EB";
const GRAY_50 = "#F9FAFB";
const WHITE = "#FFFFFF";
const A4_HEIGHT = 841.89;

/** Built-in PDF fonts: no files to ship, identical output everywhere. */
const PDF_FONTS = {
  helvetica: { regular: "Helvetica", bold: "Helvetica-Bold", oblique: "Helvetica-Oblique" },
  times: { regular: "Times-Roman", bold: "Times-Bold", oblique: "Times-Italic" },
  courier: { regular: "Courier", bold: "Courier-Bold", oblique: "Courier-Oblique" },
} as const;

function buildStyles(d: ResolvedDesign) {
  const f = PDF_FONTS[d.tokens.font];
  const fs = d.tokens.fontSize;
  const small = fs - 1;
  const r = d.tokens.rounded ? 4 : 0;
  const st = StyleSheet.create({
    page: {
      fontFamily: f.regular,
      fontSize: fs,
      color: GRAY_900,
      paddingTop: 40,
      paddingBottom: 56,
      paddingHorizontal: 44,
      lineHeight: 1.35,
    },
    bold: { fontFamily: f.bold },
    light: { color: WHITE, opacity: 0.85 },
    white: { color: WHITE },
    // header: split
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    logo: { maxWidth: 150, maxHeight: 54, objectFit: "contain" },
    senderName: { fontFamily: f.bold, fontSize: fs + 6.5 },
    docTitle: { fontFamily: f.bold, fontSize: fs + 12.5, letterSpacing: 1.5, textAlign: "right", lineHeight: 1.1, marginBottom: 10 },
    metaTable: { marginTop: 6, alignItems: "flex-end" },
    metaRow: { flexDirection: "row", justifyContent: "flex-end" },
    metaLabel: { color: GRAY_600, width: 78, textAlign: "right", marginRight: 6 },
    metaValue: { fontFamily: f.bold, width: 96, textAlign: "right" },
    // header: band
    band: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, borderRadius: r, color: WHITE },
    bandName: { fontFamily: f.bold, fontSize: fs + 6.5, color: WHITE },
    bandTitle: { fontFamily: f.bold, fontSize: fs + 12.5, letterSpacing: 1.5, textAlign: "right", lineHeight: 1.1, marginBottom: 8, color: WHITE },
    // header: centered
    centered: { alignItems: "center" },
    docTitleCentered: { fontFamily: f.bold, fontSize: fs + 14, letterSpacing: 3, textAlign: "center", marginTop: 10 },
    rule: { width: 80, height: 1.5, marginTop: 8, marginBottom: 8 },
    metaInline: { color: GRAY_600, textAlign: "center" },
    // parties
    partiesRow: { flexDirection: "row", marginTop: 26, gap: 16 },
    partyBox: { flex: 1 },
    partyBoxClient: { flex: 1, backgroundColor: d.tokens.partyBox ? GRAY_50 : undefined, borderRadius: r, padding: d.tokens.partyBox ? 10 : 0 },
    partyLabel: { color: GRAY_600, fontSize: small - 0.5, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
    partyName: { fontFamily: f.bold, fontSize: fs + 1.5, marginBottom: 1 },
    partyLine: { color: GRAY_600 },
    subject: { marginTop: 18, flexDirection: "row" },
    subjectLabel: { color: GRAY_600, marginRight: 6 },
    subjectValue: { fontFamily: f.bold },
    intro: { marginTop: 14 },
    // table
    table: { marginTop: 14 },
    th: { flexDirection: "row", fontFamily: f.bold, fontSize: small, paddingVertical: 6, paddingHorizontal: 6, borderRadius: r },
    tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: GRAY_200 },
    trAlt: { backgroundColor: GRAY_50 },
    cellDesc: { flex: 1, paddingRight: 8 },
    cellQty: { width: 48, textAlign: "right" },
    cellPrice: { width: 72, textAlign: "right" },
    cellDisc: { width: 46, textAlign: "right" },
    cellVat: { width: 40, textAlign: "right" },
    cellAmount: { width: 78, textAlign: "right" },
    descTitle: { fontFamily: f.bold },
    descDetails: { color: GRAY_600, fontSize: small, marginTop: 2 },
    // totals
    totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
    totals: { width: 270 },
    totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 6 },
    totalLabel: { color: GRAY_600 },
    totalValue: { fontFamily: f.bold },
    totalStrong: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: GRAY_200, marginTop: 2 },
    totalStrongText: { fontFamily: f.bold, fontSize: fs + 1.5 },
    payable: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 8, borderRadius: r, marginTop: 4 },
    payableText: { fontFamily: f.bold, fontSize: fs + 2.5 },
    // text blocks
    sectionTitle: { fontFamily: f.bold, fontSize: small - 0.5, textTransform: "uppercase", letterSpacing: 0.8, color: GRAY_600, marginBottom: 3 },
    sections: { marginTop: 22, flexDirection: "row", gap: 18 },
    section: { flex: 1 },
    sectionBody: { color: GRAY_900 },
    legal: { marginTop: 14, color: GRAY_600, fontSize: small - 0.5, lineHeight: 1.3 },
    closing: { marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: GRAY_200 },
    acceptance: { marginTop: 28, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    acceptanceBox: { width: 230, borderTopWidth: 1, borderTopColor: GRAY_900, paddingTop: 4, color: GRAY_600, fontSize: small - 0.5 },
    footer: {
      position: "absolute",
      // Anchored from the top on purpose: with lineHeight set on the page,
      // react-pdf places a fixed `bottom`-anchored block thousands of points
      // above the sheet (footer and page numbers vanished). The page is always A4.
      top: A4_HEIGHT - 38,
      left: 44,
      right: 44,
      flexDirection: "row",
      justifyContent: "space-between",
      color: GRAY_400,
      fontSize: 8,
    },
    watermark: { position: "absolute", top: 330, left: 70, fontFamily: f.bold, fontSize: 78, color: GRAY_200, opacity: 0.7, transform: "rotate(-30deg)", letterSpacing: 6 },
    // cover page
    coverPage: { fontFamily: f.regular, fontSize: fs, color: GRAY_900 },
    coverBand: { height: 170, paddingHorizontal: 44, paddingTop: 44, justifyContent: "flex-start" },
    coverSender: { fontFamily: f.bold, fontSize: fs + 8, color: WHITE },
    coverLogo: { maxWidth: 170, maxHeight: 60, objectFit: "contain" },
    coverBody: { paddingHorizontal: 44, paddingTop: 64 },
    coverKicker: { color: GRAY_600, fontSize: fs + 0.5, letterSpacing: 1.5, textTransform: "uppercase" },
    coverTitle: { fontFamily: f.bold, fontSize: fs + 22, lineHeight: 1.15, marginTop: 8 },
    coverSubtitle: { color: GRAY_600, fontSize: fs + 4, marginTop: 10 },
    coverImage: { width: 507, height: 230, objectFit: "contain", marginTop: 28 },
    coverMeta: { marginTop: 36, borderTopWidth: 1, borderTopColor: GRAY_200, paddingTop: 12 },
    coverMetaRow: { flexDirection: "row", marginBottom: 3 },
    coverMetaLabel: { width: 120, color: GRAY_600 },
    coverMetaValue: { fontFamily: f.bold },
    coverFooter: { position: "absolute", top: A4_HEIGHT - 60, left: 44, right: 44, color: GRAY_400, fontSize: 8 },
  });
  return { fonts: f, st };
}

type Sheet = ReturnType<typeof buildStyles>["st"];
type ViewStyle = React.ComponentProps<typeof View>["style"];

type Props = { quote: Quote; watermark: boolean; /** Public site URL, printed as a link in the footer of free (watermarked) PDFs */ siteUrl?: string };

function PartyBlock({ party, label, boxStyle, L, st }: { party: Party; label: string; boxStyle: ViewStyle; L: DocLabels; st: Sheet }) {
  const lines = addressLines(party);
  return (
    <View style={boxStyle}>
      <Text style={st.partyLabel}>{label}</Text>
      <Text style={st.partyName}>{s(party.name) || "—"}</Text>
      {lines.map((l, i) => (
        <Text key={i} style={st.partyLine}>
          {s(l)}
        </Text>
      ))}
      {party.vat ? (
        <Text style={st.partyLine}>
          {L.vat} {s(party.vat)}
        </Text>
      ) : null}
      {party.taxCode ? (
        <Text style={st.partyLine}>
          {L.taxCode} {s(party.taxCode)}
        </Text>
      ) : null}
      {party.email ? <Text style={st.partyLine}>{s(party.email)}</Text> : null}
      {party.phone ? (
        <Text style={st.partyLine}>
          {L.phone} {s(party.phone)}
        </Text>
      ) : null}
      {party.pec ? (
        <Text style={st.partyLine}>
          {L.pec} {s(party.pec)}
        </Text>
      ) : null}
      {party.sdi ? (
        <Text style={st.partyLine}>
          {L.sdi} {s(party.sdi)}
        </Text>
      ) : null}
      {party.website ? <Text style={st.partyLine}>{s(party.website)}</Text> : null}
    </View>
  );
}

function MetaRows({ quote, L, st, light }: { quote: Quote; L: DocLabels; st: Sheet; light?: boolean }) {
  const rows: [string, string][] = [
    [L.number, s(quote.number)],
    [L.date, formatDate(quote.date, quote.lang)],
    [L.validUntil, formatDate(validUntil(quote), quote.lang)],
  ];
  return (
    <View style={st.metaTable}>
      {rows.map(([k, v]) => (
        <View key={k} style={st.metaRow}>
          <Text style={light ? [st.metaLabel, st.light] : st.metaLabel}>{k}</Text>
          <Text style={light ? [st.metaValue, st.white] : st.metaValue}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function sanitizeLabels(labels: DocLabels): DocLabels {
  return Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, s(v)])) as DocLabels;
}

export function QuoteDocument({ quote, watermark, siteUrl }: Props) {
  const d = resolveDesign(quote);
  const L = sanitizeLabels(d.labels);
  const { fonts, st } = buildStyles(d);
  const t = computeTotals(quote);
  const color = /^#[0-9a-fA-F]{6}$/.test(quote.branding.color) ? quote.branding.color : "#1E3A8A";
  const cur = quote.currency;
  const lang = quote.lang;
  const money = (n: number) => formatMoney(n, cur, lang);
  const cols = d.columns;
  const showDiscountCol = quote.items.some((i) => (i.discountPct ?? 0) > 0);
  const hasExempt = t.vatGroups.some((g) => g.rate === 0);
  const occasionale = !quote.options.regimeForfettario && Boolean(quote.options.prestazioneOccasionale);
  const siteHost = siteUrl ? siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
  const siteLink = siteUrl ? `${siteUrl.replace(/\/$/, "")}/?utm_source=pdf&utm_medium=footer` : undefined;
  const title = s(quote.subject);
  const senderName = s(quote.sender.name);
  const logo = quote.branding.logo;
  const filledTh = d.tokens.tableHeader === "filled";
  const senderContact = [senderName, ...addressLines(quote.sender).map(s), s(quote.sender.email), s(quote.sender.phone)].filter(Boolean).join(" · ");

  const watermarkEl = watermark ? (
    <Text style={st.watermark} fixed>
      {L.preview}
    </Text>
  ) : null;

  return (
    <Document title={`${L.quote} ${s(quote.number)}`} author={senderName || BRAND} subject={title} creator={BRAND} producer={BRAND} language={lang}>
      {d.cover ? (
        <Page size="A4" style={st.coverPage}>
          {watermarkEl}
          <View style={[st.coverBand, { backgroundColor: color }]}>
            {logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logo} style={st.coverLogo} />
            ) : (
              <Text style={st.coverSender}>{senderName || L.quote}</Text>
            )}
          </View>
          <View style={st.coverBody}>
            <Text style={st.coverKicker}>
              {L.quote} {s(quote.number)}
            </Text>
            <Text style={[st.coverTitle, { color }]}>{s(d.cover.title) || title || L.quote}</Text>
            {d.cover.subtitle ? <Text style={st.coverSubtitle}>{s(d.cover.subtitle)}</Text> : null}
            {d.cover.image ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={d.cover.image} style={st.coverImage} />
            ) : null}
            <View style={st.coverMeta}>
              <View style={st.coverMetaRow}>
                <Text style={st.coverMetaLabel}>{L.to}</Text>
                <Text style={st.coverMetaValue}>{s(quote.client.name) || "—"}</Text>
              </View>
              <View style={st.coverMetaRow}>
                <Text style={st.coverMetaLabel}>{L.date}</Text>
                <Text style={st.coverMetaValue}>{formatDate(quote.date, lang)}</Text>
              </View>
              <View style={st.coverMetaRow}>
                <Text style={st.coverMetaLabel}>{L.validUntil}</Text>
                <Text style={st.coverMetaValue}>{formatDate(validUntil(quote), lang)}</Text>
              </View>
            </View>
          </View>
          <View style={st.coverFooter}>
            <Text>{senderContact}</Text>
          </View>
        </Page>
      ) : null}

      <Page size="A4" style={st.page}>
        {watermarkEl}

        {/* Header */}
        {d.tokens.header === "band" ? (
          <View style={[st.band, { backgroundColor: color }]}>
            <View style={{ maxWidth: 280 }}>
              {logo ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={logo} style={st.logo} />
              ) : (
                <Text style={st.bandName}>{senderName || L.quote}</Text>
              )}
            </View>
            <View>
              <Text style={st.bandTitle}>{L.quote}</Text>
              <MetaRows quote={quote} L={L} st={st} light />
            </View>
          </View>
        ) : d.tokens.header === "centered" ? (
          <View style={st.centered}>
            {logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logo} style={st.logo} />
            ) : (
              <Text style={[st.senderName, { color }]}>{senderName || L.quote}</Text>
            )}
            <Text style={[st.docTitleCentered, { color }]}>{L.quote}</Text>
            <View style={[st.rule, { backgroundColor: color }]} />
            <Text style={st.metaInline}>
              {L.number} <Text style={st.bold}>{s(quote.number)}</Text> · {L.date} <Text style={st.bold}>{formatDate(quote.date, lang)}</Text> · {L.validUntil}{" "}
              <Text style={st.bold}>{formatDate(validUntil(quote), lang)}</Text>
            </Text>
          </View>
        ) : (
          <View style={st.headerRow}>
            <View style={{ maxWidth: 280 }}>
              {logo ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={logo} style={st.logo} />
              ) : (
                <Text style={[st.senderName, { color }]}>{senderName || L.quote}</Text>
              )}
            </View>
            <View>
              <Text style={[st.docTitle, { color }]}>{L.quote}</Text>
              <MetaRows quote={quote} L={L} st={st} />
            </View>
          </View>
        )}

        {/* Parties */}
        <View style={st.partiesRow}>
          <PartyBlock party={quote.sender} label={L.from} boxStyle={st.partyBox} L={L} st={st} />
          <PartyBlock party={quote.client} label={L.to} boxStyle={st.partyBoxClient} L={L} st={st} />
        </View>

        {title ? (
          <View style={st.subject}>
            <Text style={st.subjectLabel}>{L.subject}:</Text>
            <Text style={st.subjectValue}>{title}</Text>
          </View>
        ) : null}

        {d.intro ? <Text style={st.intro}>{s(d.intro)}</Text> : null}

        {/* Items */}
        <View style={st.table}>
          <View style={[st.th, filledTh ? { backgroundColor: color, color: WHITE } : { color, borderBottomWidth: 1.5, borderBottomColor: color, borderRadius: 0 }]} fixed>
            <Text style={st.cellDesc}>{L.description}</Text>
            {cols.qty ? <Text style={st.cellQty}>{L.qty}</Text> : null}
            {cols.unitPrice ? <Text style={st.cellPrice}>{L.unitPrice}</Text> : null}
            {showDiscountCol ? <Text style={st.cellDisc}>{L.discount}</Text> : null}
            {cols.vat ? <Text style={st.cellVat}>{L.vatRate}</Text> : null}
            <Text style={st.cellAmount}>{L.amount}</Text>
          </View>
          {quote.items.map((it, idx) => {
            const lt = t.lines[idx];
            const qty = `${formatNumber(it.quantity, lang, 3)}${it.unit ? ` ${s(it.unit)}` : ""}`;
            return (
              <View key={it.id} style={idx % 2 === 1 ? [st.tr, st.trAlt] : st.tr} wrap={false}>
                <View style={st.cellDesc}>
                  <Text style={st.descTitle}>{s(it.description) || "—"}</Text>
                  {it.details ? <Text style={st.descDetails}>{s(it.details)}</Text> : null}
                </View>
                {cols.qty ? <Text style={st.cellQty}>{qty}</Text> : null}
                {cols.unitPrice ? <Text style={st.cellPrice}>{money(it.unitPrice)}</Text> : null}
                {showDiscountCol ? <Text style={st.cellDisc}>{it.discountPct ? formatPct(it.discountPct, lang) : "—"}</Text> : null}
                {cols.vat ? <Text style={st.cellVat}>{formatNumber(lt.vatRate, lang)}%</Text> : null}
                <Text style={st.cellAmount}>{money(lt.net)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={st.totalsRow} wrap={false}>
          <View style={st.totals}>
            {t.lineDiscounts > 0 || t.globalDiscount > 0 ? (
              <View style={st.totalLine}>
                <Text style={st.totalLabel}>{L.subtotal}</Text>
                <Text style={st.totalValue}>{money(t.subtotal)}</Text>
              </View>
            ) : null}
            {t.lineDiscounts > 0 ? (
              <View style={st.totalLine}>
                <Text style={st.totalLabel}>{L.lineDiscounts}</Text>
                <Text style={st.totalValue}>-{money(t.lineDiscounts)}</Text>
              </View>
            ) : null}
            {t.globalDiscount > 0 ? (
              <View style={st.totalLine}>
                <Text style={st.totalLabel}>
                  {L.globalDiscount} {formatPct(quote.options.globalDiscountPct, lang)}
                </Text>
                <Text style={st.totalValue}>-{money(t.globalDiscount)}</Text>
              </View>
            ) : null}
            <View style={st.totalLine}>
              <Text style={st.totalLabel}>{L.net}</Text>
              <Text style={st.totalValue}>{money(t.net)}</Text>
            </View>
            {t.rivalsa > 0 ? (
              <>
                <View style={st.totalLine}>
                  <Text style={st.totalLabel}>{s(rivalsaCaption(quote.options, lang))}</Text>
                  <Text style={st.totalValue}>{money(t.rivalsa)}</Text>
                </View>
                <View style={st.totalLine}>
                  <Text style={st.totalLabel}>{L.taxable}</Text>
                  <Text style={st.totalValue}>{money(t.taxable)}</Text>
                </View>
              </>
            ) : null}
            {t.vatGroups.map((g) => (
              <View style={st.totalLine} key={g.rate}>
                <Text style={st.totalLabel}>
                  {L.vatOn} {formatNumber(g.rate, lang)}%{t.vatGroups.length > 1 ? ` (${money(g.base)})` : ""}
                </Text>
                <Text style={st.totalValue}>{money(g.vat)}</Text>
              </View>
            ))}
            {t.bollo > 0 ? (
              <View style={st.totalLine}>
                <Text style={st.totalLabel}>{L.bollo}</Text>
                <Text style={st.totalValue}>{money(t.bollo)}</Text>
              </View>
            ) : null}
            <View style={st.totalStrong}>
              <Text style={st.totalStrongText}>{L.total}</Text>
              <Text style={st.totalStrongText}>{money(t.total)}</Text>
            </View>
            {t.ritenuta > 0 ? (
              <>
                <View style={st.totalLine}>
                  <Text style={st.totalLabel}>
                    {L.ritenuta} {formatPct(quote.options.ritenutaAccontoPct, lang)}
                  </Text>
                  <Text style={st.totalValue}>-{money(t.ritenuta)}</Text>
                </View>
                <View style={[st.payable, d.tokens.totalsHighlight === "filled" ? { backgroundColor: color, color: WHITE } : { borderWidth: 1.5, borderColor: color, color }]}>
                  <Text style={st.payableText}>{L.netPayable}</Text>
                  <Text style={st.payableText}>{money(t.netPayable)}</Text>
                </View>
              </>
            ) : null}
            {t.deposit > 0 ? (
              <View style={st.totalLine}>
                <Text style={st.totalLabel}>
                  {L.deposit} ({formatPct(quote.options.depositPct, lang)})
                </Text>
                <Text style={st.totalValue}>{money(t.deposit)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Notes & terms */}
        {quote.notes || quote.paymentTerms ? (
          <View style={st.sections}>
            {quote.notes ? (
              <View style={st.section}>
                <Text style={st.sectionTitle}>{L.notes}</Text>
                <Text style={st.sectionBody}>{s(quote.notes)}</Text>
              </View>
            ) : null}
            {quote.paymentTerms ? (
              <View style={st.section}>
                <Text style={st.sectionTitle}>{L.paymentTerms}</Text>
                <Text style={st.sectionBody}>{s(quote.paymentTerms)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Legal wording */}
        {quote.options.regimeForfettario || occasionale || hasExempt || t.bollo > 0 ? (
          <View style={st.legal}>
            {quote.options.regimeForfettario ? <Text>{L.forfettarioNote}</Text> : null}
            {occasionale ? (
              <Text>
                {L.occasionaleNote}
                {t.ritenuta > 0 ? ` ${L.occasionaleRitenutaNote}` : ""}
              </Text>
            ) : null}
            {hasExempt && !quote.options.regimeForfettario && !occasionale ? <Text>{s(quote.options.vatExemptNote) || L.exemptNote}</Text> : null}
            {t.bollo > 0 ? <Text>{L.bolloNote}</Text> : null}
          </View>
        ) : null}

        {d.closing ? (
          <View style={st.closing}>
            <Text style={st.sectionBody}>{s(d.closing)}</Text>
          </View>
        ) : null}

        {/* Acceptance */}
        {d.showSignature || d.showValidity ? (
          <View style={st.acceptance} wrap={false}>
            <View style={{ color: GRAY_600, fontSize: 8, width: 230 }}>
              {d.showValidity ? (
                <Text>
                  {L.validUntil} {formatDate(validUntil(quote), lang)}
                </Text>
              ) : null}
            </View>
            {d.showSignature ? (
              <View style={st.acceptanceBox}>
                <Text style={{ fontFamily: fonts.bold, color: GRAY_900 }}>{L.acceptance}</Text>
                <Text>{L.signature}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        <View style={st.footer} fixed>
          {watermark ? (
            // A Link must sit inside a Text: on its own in a fixed View it breaks the layout.
            <Text style={{ fontFamily: fonts.oblique }}>
              {siteLink ? (
                <Link src={siteLink} style={{ color: GRAY_400, textDecoration: "none" }}>
                  {L.generatedWith} · {siteHost}
                </Link>
              ) : (
                L.generatedWith
              )}
            </Text>
          ) : (
            <Text style={{ fontFamily: fonts.oblique }}>{senderName}</Text>
          )}
          <Text render={({ pageNumber, totalPages }) => `${L.page} ${pageNumber} ${L.of} ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
