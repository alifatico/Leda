import { BRAND } from "@/lib/brand";
import React from "react";
import {
  Document,
  Font,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  addressLines,
  computeTotals,
  formatDate,
  formatMoney,
  formatNumber,
  formatPct,
  labelsFor,
  rivalsaCaption,
  validUntil,
  type Quote,
  type Party,
} from "@/lib/quote";
import { sanitizeForPdf as s } from "./sanitize";

// Italian words break badly with the default English hyphenator.
Font.registerHyphenationCallback((word) => [word]);

const FONT = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";
const FONT_OBLIQUE = "Helvetica-Oblique";

const GRAY_900 = "#111827";
const GRAY_600 = "#4B5563";
const GRAY_400 = "#9CA3AF";
const GRAY_200 = "#E5E7EB";
const GRAY_50 = "#F9FAFB";
const A4_HEIGHT = 841.89;

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 9.5,
    color: GRAY_900,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    lineHeight: 1.35,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: { maxWidth: 150, maxHeight: 54, objectFit: "contain" },
  senderName: { fontFamily: FONT_BOLD, fontSize: 16 },
  docTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 22,
    letterSpacing: 1.5,
    textAlign: "right",
    lineHeight: 1.1,
    marginBottom: 10,
  },
  metaTable: { marginTop: 6, alignItems: "flex-end" },
  metaRow: { flexDirection: "row", justifyContent: "flex-end" },
  metaLabel: { color: GRAY_600, width: 78, textAlign: "right", marginRight: 6 },
  metaValue: { fontFamily: FONT_BOLD, width: 96, textAlign: "right" },
  partiesRow: { flexDirection: "row", marginTop: 26, gap: 16 },
  partyBox: { flex: 1 },
  partyBoxClient: {
    flex: 1,
    backgroundColor: GRAY_50,
    borderRadius: 4,
    padding: 10,
  },
  partyLabel: {
    color: GRAY_600,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  partyName: { fontFamily: FONT_BOLD, fontSize: 11, marginBottom: 1 },
  partyLine: { color: GRAY_600 },
  subject: { marginTop: 18, flexDirection: "row" },
  subjectLabel: { color: GRAY_600, marginRight: 6 },
  subjectValue: { fontFamily: FONT_BOLD },
  table: { marginTop: 14 },
  th: {
    flexDirection: "row",
    color: "#FFFFFF",
    fontFamily: FONT_BOLD,
    fontSize: 8.5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  trAlt: { backgroundColor: GRAY_50 },
  cellDesc: { flex: 1, paddingRight: 8 },
  cellQty: { width: 48, textAlign: "right" },
  cellPrice: { width: 72, textAlign: "right" },
  cellDisc: { width: 46, textAlign: "right" },
  cellVat: { width: 40, textAlign: "right" },
  cellAmount: { width: 78, textAlign: "right" },
  descTitle: { fontFamily: FONT_BOLD },
  descDetails: { color: GRAY_600, fontSize: 8.5, marginTop: 2 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  totals: { width: 270 },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  totalLabel: { color: GRAY_600 },
  totalValue: { fontFamily: FONT_BOLD },
  totalStrong: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
    marginTop: 2,
  },
  totalStrongText: { fontFamily: FONT_BOLD, fontSize: 11 },
  payable: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
    color: "#FFFFFF",
  },
  payableText: { fontFamily: FONT_BOLD, fontSize: 12 },
  sectionTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: GRAY_600,
    marginBottom: 3,
  },
  sections: { marginTop: 22, flexDirection: "row", gap: 18 },
  section: { flex: 1 },
  sectionBody: { color: GRAY_900 },
  legal: { marginTop: 14, color: GRAY_600, fontSize: 8, lineHeight: 1.3 },
  acceptance: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  acceptanceBox: {
    width: 230,
    borderTopWidth: 1,
    borderTopColor: GRAY_900,
    paddingTop: 4,
    color: GRAY_600,
    fontSize: 8,
  },
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
  watermark: {
    position: "absolute",
    top: 330,
    left: 70,
    fontFamily: FONT_BOLD,
    fontSize: 78,
    color: "#E5E7EB",
    opacity: 0.7,
    transform: "rotate(-30deg)",
    letterSpacing: 6,
  },
});

type Props = {
  quote: Quote;
  watermark: boolean;
  /** Public site URL, printed as a link in the footer of free (watermarked) PDFs */ siteUrl?: string;
};

type ViewStyle = React.ComponentProps<typeof View>["style"];

function PartyBlock({
  party,
  label,
  boxStyle,
  lang,
}: {
  party: Party;
  label: string;
  boxStyle: ViewStyle;
  lang: Quote["lang"];
}) {
  const L = labelsFor(lang);
  const lines = addressLines(party);
  return (
    <View style={boxStyle}>
      <Text style={styles.partyLabel}>{label}</Text>
      <Text style={styles.partyName}>{s(party.name) || "—"}</Text>
      {lines.map((l, i) => (
        <Text key={i} style={styles.partyLine}>
          {s(l)}
        </Text>
      ))}
      {party.vat ? (
        <Text style={styles.partyLine}>
          {L.vat} {s(party.vat)}
        </Text>
      ) : null}
      {party.taxCode ? (
        <Text style={styles.partyLine}>
          {L.taxCode} {s(party.taxCode)}
        </Text>
      ) : null}
      {party.email ? (
        <Text style={styles.partyLine}>{s(party.email)}</Text>
      ) : null}
      {party.phone ? (
        <Text style={styles.partyLine}>
          {L.phone} {s(party.phone)}
        </Text>
      ) : null}
      {party.pec ? (
        <Text style={styles.partyLine}>
          {L.pec} {s(party.pec)}
        </Text>
      ) : null}
      {party.sdi ? (
        <Text style={styles.partyLine}>
          {L.sdi} {s(party.sdi)}
        </Text>
      ) : null}
      {party.website ? (
        <Text style={styles.partyLine}>{s(party.website)}</Text>
      ) : null}
    </View>
  );
}

export function QuoteDocument({ quote, watermark, siteUrl }: Props) {
  const L = labelsFor(quote.lang);
  const t = computeTotals(quote);
  const color = /^#[0-9a-fA-F]{6}$/.test(quote.branding.color)
    ? quote.branding.color
    : "#1E3A8A";
  const cur = quote.currency;
  const lang = quote.lang;
  const money = (n: number) => formatMoney(n, cur, lang);
  const showDiscountCol = quote.items.some((i) => (i.discountPct ?? 0) > 0);
  const hasExempt = t.vatGroups.some((g) => g.rate === 0);
  const occasionale =
    !quote.options.regimeForfettario &&
    Boolean(quote.options.prestazioneOccasionale);
  const siteHost = siteUrl
    ? siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "";
  const siteLink = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/?utm_source=pdf&utm_medium=footer`
    : undefined;
  const title = s(quote.subject);

  return (
    <Document
      title={`${L.quote} ${s(quote.number)}`}
      author={s(quote.sender.name) || BRAND}
      subject={title}
      creator={BRAND}
      producer={BRAND}
      language={lang}
    >
      <Page size="A4" style={styles.page}>
        {watermark ? (
          <Text style={styles.watermark} fixed>
            {L.preview}
          </Text>
        ) : null}

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ maxWidth: 280 }}>
            {quote.branding.logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={quote.branding.logo} style={styles.logo} />
            ) : (
              <Text style={[styles.senderName, { color }]}>
                {s(quote.sender.name) || L.quote}
              </Text>
            )}
          </View>
          <View>
            <Text style={[styles.docTitle, { color }]}>{L.quote}</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{L.number}</Text>
                <Text style={styles.metaValue}>{s(quote.number)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{L.date}</Text>
                <Text style={styles.metaValue}>
                  {formatDate(quote.date, lang)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{L.validUntil}</Text>
                <Text style={styles.metaValue}>
                  {formatDate(validUntil(quote), lang)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          <PartyBlock
            party={quote.sender}
            label={L.from}
            boxStyle={styles.partyBox}
            lang={lang}
          />
          <PartyBlock
            party={quote.client}
            label={L.to}
            boxStyle={styles.partyBoxClient}
            lang={lang}
          />
        </View>

        {title ? (
          <View style={styles.subject}>
            <Text style={styles.subjectLabel}>{L.subject}:</Text>
            <Text style={styles.subjectValue}>{title}</Text>
          </View>
        ) : null}

        {/* Items */}
        <View style={styles.table}>
          <View style={[styles.th, { backgroundColor: color }]} fixed>
            <Text style={styles.cellDesc}>{L.description}</Text>
            <Text style={styles.cellQty}>{L.qty}</Text>
            <Text style={styles.cellPrice}>{L.unitPrice}</Text>
            {showDiscountCol ? (
              <Text style={styles.cellDisc}>{L.discount}</Text>
            ) : null}
            <Text style={styles.cellVat}>{L.vatRate}</Text>
            <Text style={styles.cellAmount}>{L.amount}</Text>
          </View>
          {quote.items.map((it, idx) => {
            const lt = t.lines[idx];
            const qty = `${formatNumber(it.quantity, lang, 3)}${it.unit ? ` ${s(it.unit)}` : ""}`;
            return (
              <View
                key={it.id}
                style={idx % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr}
                wrap={false}
              >
                <View style={styles.cellDesc}>
                  <Text style={styles.descTitle}>
                    {s(it.description) || "—"}
                  </Text>
                  {it.details ? (
                    <Text style={styles.descDetails}>{s(it.details)}</Text>
                  ) : null}
                </View>
                <Text style={styles.cellQty}>{qty}</Text>
                <Text style={styles.cellPrice}>{money(it.unitPrice)}</Text>
                {showDiscountCol ? (
                  <Text style={styles.cellDisc}>
                    {it.discountPct ? formatPct(it.discountPct, lang) : "—"}
                  </Text>
                ) : null}
                <Text style={styles.cellVat}>
                  {formatNumber(lt.vatRate, lang)}%
                </Text>
                <Text style={styles.cellAmount}>{money(lt.net)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsRow} wrap={false}>
          <View style={styles.totals}>
            {t.lineDiscounts > 0 || t.globalDiscount > 0 ? (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>{L.subtotal}</Text>
                <Text style={styles.totalValue}>{money(t.subtotal)}</Text>
              </View>
            ) : null}
            {t.lineDiscounts > 0 ? (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>{L.lineDiscounts}</Text>
                <Text style={styles.totalValue}>-{money(t.lineDiscounts)}</Text>
              </View>
            ) : null}
            {t.globalDiscount > 0 ? (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>
                  {L.globalDiscount}{" "}
                  {formatPct(quote.options.globalDiscountPct, lang)}
                </Text>
                <Text style={styles.totalValue}>
                  -{money(t.globalDiscount)}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{L.net}</Text>
              <Text style={styles.totalValue}>{money(t.net)}</Text>
            </View>
            {t.rivalsa > 0 ? (
              <>
                <View style={styles.totalLine}>
                  <Text style={styles.totalLabel}>
                    {s(rivalsaCaption(quote.options, lang))}
                  </Text>
                  <Text style={styles.totalValue}>{money(t.rivalsa)}</Text>
                </View>
                <View style={styles.totalLine}>
                  <Text style={styles.totalLabel}>{L.taxable}</Text>
                  <Text style={styles.totalValue}>{money(t.taxable)}</Text>
                </View>
              </>
            ) : null}
            {t.vatGroups.map((g) => (
              <View style={styles.totalLine} key={g.rate}>
                <Text style={styles.totalLabel}>
                  {L.vatOn} {formatNumber(g.rate, lang)}%
                  {t.vatGroups.length > 1 ? ` (${money(g.base)})` : ""}
                </Text>
                <Text style={styles.totalValue}>{money(g.vat)}</Text>
              </View>
            ))}
            {t.bollo > 0 ? (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>{L.bollo}</Text>
                <Text style={styles.totalValue}>{money(t.bollo)}</Text>
              </View>
            ) : null}
            <View style={styles.totalStrong}>
              <Text style={styles.totalStrongText}>{L.total}</Text>
              <Text style={styles.totalStrongText}>{money(t.total)}</Text>
            </View>
            {t.ritenuta > 0 ? (
              <>
                <View style={styles.totalLine}>
                  <Text style={styles.totalLabel}>
                    {L.ritenuta}{" "}
                    {formatPct(quote.options.ritenutaAccontoPct, lang)}
                  </Text>
                  <Text style={styles.totalValue}>-{money(t.ritenuta)}</Text>
                </View>
                <View style={[styles.payable, { backgroundColor: color }]}>
                  <Text style={styles.payableText}>{L.netPayable}</Text>
                  <Text style={styles.payableText}>{money(t.netPayable)}</Text>
                </View>
              </>
            ) : null}
            {t.deposit > 0 ? (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>
                  {L.deposit} ({formatPct(quote.options.depositPct, lang)})
                </Text>
                <Text style={styles.totalValue}>{money(t.deposit)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Notes & terms */}
        {quote.notes || quote.paymentTerms ? (
          <View style={styles.sections}>
            {quote.notes ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{L.notes}</Text>
                <Text style={styles.sectionBody}>{s(quote.notes)}</Text>
              </View>
            ) : null}
            {quote.paymentTerms ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{L.paymentTerms}</Text>
                <Text style={styles.sectionBody}>{s(quote.paymentTerms)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Legal wording */}
        {quote.options.regimeForfettario ||
        occasionale ||
        hasExempt ||
        t.bollo > 0 ? (
          <View style={styles.legal}>
            {quote.options.regimeForfettario ? (
              <Text>{L.forfettarioNote}</Text>
            ) : null}
            {occasionale ? (
              <Text>
                {L.occasionaleNote}
                {t.ritenuta > 0 ? ` ${L.occasionaleRitenutaNote}` : ""}
              </Text>
            ) : null}
            {hasExempt && !quote.options.regimeForfettario && !occasionale ? (
              <Text>{s(quote.options.vatExemptNote) || L.exemptNote}</Text>
            ) : null}
            {t.bollo > 0 ? <Text>{L.bolloNote}</Text> : null}
          </View>
        ) : null}

        {/* Acceptance */}
        <View style={styles.acceptance} wrap={false}>
          <View style={{ color: GRAY_600, fontSize: 8, width: 230 }}>
            <Text>
              {L.validUntil} {formatDate(validUntil(quote), lang)}
            </Text>
          </View>
          <View style={styles.acceptanceBox}>
            <Text style={{ fontFamily: FONT_BOLD, color: GRAY_900 }}>
              {L.acceptance}
            </Text>
            <Text>{L.signature}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          {watermark ? (
            // A Link must sit inside a Text: on its own in a fixed View it breaks the layout.
            <Text style={{ fontFamily: FONT_OBLIQUE }}>
              {siteLink ? (
                <Link
                  src={siteLink}
                  style={{ color: GRAY_400, textDecoration: "none" }}
                >
                  {L.generatedWith} · {siteHost}
                </Link>
              ) : (
                L.generatedWith
              )}
            </Text>
          ) : (
            <Text style={{ fontFamily: FONT_OBLIQUE }}>
              {s(quote.sender.name)}
            </Text>
          )}
          <Text
            render={({ pageNumber, totalPages }) =>
              `${L.page} ${pageNumber} ${L.of} ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
