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
  headlineAmount,
  HERO_HEIGHT,
  itemIndex,
  monogram,
  resolveDesign,
  rivalsaCaption,
  SIDEBAR_WIDTH,
  STRIPE_WIDTH,
  validUntil,
  type DocLabels,
  type Palette,
  type Party,
  type Quote,
  type ResolvedDesign,
  type Totals,
} from "@/lib/quote";
import { pdfFamily } from "./fonts";
import { sanitizeForPdf as s } from "./sanitize";

// Italian words break badly with the default English hyphenator.
Font.registerHyphenationCallback((word) => [word]);

const WHITE = "#FFFFFF";
const A4_HEIGHT = 841.89;

type Fonts = { body: string; display: string };

/**
 * Every size that differs from the page's gets its own line height: react-pdf
 * resolves a unitless lineHeight against the font size of the element that
 * declares it, so a title would otherwise inherit the body's line box.
 */
const size = (fontSize: number, lineHeight = 1.3) => ({ fontSize, lineHeight });

function buildStyles(d: ResolvedDesign, fonts: Fonts) {
  const tk = d.tokens;
  const P = d.palette;
  const fs = tk.fontSize;
  const small = fs - 1;
  const tiny = fs - 2.5;
  const r = tk.radius;
  const mono = tk.layout === "swiss" || tk.layout === "masthead";
  /** Section labels: the brand shade on coloured styles, grey on the monochrome ones */
  const labelColor = mono ? P.muted : P.deep;
  const padLeft = tk.layout === "sidebar" ? SIDEBAR_WIDTH + 28 : tk.margins.x;
  /** Numeric columns shrink a little next to the sidebar, where the body is narrower */
  const cw = tk.layout === "sidebar" ? 0.88 : 1;
  const st = StyleSheet.create({
    page: {
      fontFamily: fonts.body,
      fontSize: fs,
      color: P.ink,
      paddingTop: tk.margins.top,
      paddingBottom: 60,
      paddingLeft: padLeft,
      paddingRight: tk.layout === "sidebar" ? 32 : tk.margins.x,
      lineHeight: 1.35,
    },
    display: { fontFamily: fonts.display },
    semibold: { fontWeight: 600 },
    bold: { fontWeight: 700 },
    muted: { color: P.muted },
    label: { ...size(tiny, 1.3), textTransform: "uppercase", letterSpacing: 0.9, color: labelColor, fontWeight: 600 },
    // header: letterhead
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    logo: { maxWidth: 150, maxHeight: 54, objectFit: "contain" },
    senderName: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 6.5, 1.2), color: P.deep },
    docTitle: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 12.5, 1.1), letterSpacing: 1.5, textAlign: "right", color: P.accent, marginBottom: 8 },
    metaRow: { flexDirection: "row", justifyContent: "flex-end" },
    metaLabel: { color: P.muted, width: 84, textAlign: "right", marginRight: 6 },
    metaValue: { fontWeight: 600, width: 96, textAlign: "right" },
    letterheadRule: { flexDirection: "row", alignItems: "flex-start", marginTop: 14 },
    // header: hero band
    heroBand: { position: "absolute", top: 0, left: 0, right: 0, height: HERO_HEIGHT, backgroundColor: P.accent, paddingTop: 34, paddingBottom: 26, paddingHorizontal: tk.margins.x, justifyContent: "space-between", color: P.onAccent },
    heroTitle: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 16.5, 1.1), letterSpacing: 0.5, textAlign: "right", color: P.onAccent },
    heroMeta: { ...size(small, 1.3), textAlign: "right", color: P.onAccent, opacity: 0.85, marginTop: 2 },
    heroContact: { ...size(small, 1.3), color: P.onAccent, opacity: 0.85, maxWidth: 280 },
    heroAmountLabel: { ...size(tiny, 1.3), textTransform: "uppercase", letterSpacing: 0.9, color: P.onAccent, opacity: 0.85, textAlign: "right" },
    heroAmount: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 11, 1.15), color: P.onAccent, textAlign: "right" },
    logoCard: { backgroundColor: WHITE, padding: 6, borderRadius: r, alignSelf: "flex-start" },
    badge: { width: 34, height: 34, borderRadius: r || 17, alignItems: "center", justifyContent: "center" },
    badgeText: { fontFamily: fonts.display, fontWeight: 700, ...size(13, 1) },
    // header: swiss
    kicker: { ...size(tiny + 0.5, 1.3), textTransform: "uppercase", letterSpacing: 1.6, color: P.muted, fontWeight: 600 },
    swissTitle: { fontFamily: fonts.display, fontWeight: 600, ...size(fs + 10.5, 1.2), marginTop: 6, letterSpacing: -0.2 },
    metaGrid: { flexDirection: "row", marginTop: 20, paddingVertical: 9, borderTopWidth: 0.8, borderBottomWidth: 0.8, borderColor: P.ink },
    metaCell: { flex: 1 },
    // header: masthead
    masthead: { alignItems: "center" },
    mastheadSender: { fontFamily: fonts.display, fontWeight: 600, ...size(fs + 5, 1.25), color: P.deep, textAlign: "center" },
    mastheadTitle: { fontFamily: fonts.display, fontWeight: 600, ...size(fs + 14, 1.15), letterSpacing: 4, textAlign: "center", color: P.deep },
    mastheadMeta: { ...size(small, 1.3), color: P.muted, textAlign: "center", marginTop: 6 },
    shortRule: { width: 28, height: 1.5, backgroundColor: P.accent, marginVertical: 9 },
    doubleRule: { height: 4, borderTopWidth: 0.8, borderBottomWidth: 0.8, borderColor: P.ink, marginTop: 16 },
    // header: dense
    stripe: { position: "absolute", top: 0, left: 0, width: STRIPE_WIDTH, height: A4_HEIGHT, backgroundColor: P.accent },
    denseTitle: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 6.5, 1.15), color: P.accent, letterSpacing: 1, textAlign: "right" },
    denseMeta: { ...size(small, 1.3), color: P.muted, textAlign: "right", marginTop: 2 },
    hairline: { height: 0.8, backgroundColor: P.rule },
    // header: sidebar
    sidebar: { position: "absolute", top: 0, left: 0, width: SIDEBAR_WIDTH, height: A4_HEIGHT, backgroundColor: P.accent, paddingTop: tk.margins.top, paddingHorizontal: 18, color: P.onAccent },
    sideSender: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 2.5, 1.2), color: P.onAccent, marginTop: 12 },
    sideLine: { ...size(small - 0.5, 1.35), color: P.onAccent, opacity: 0.85 },
    sideLabel: { ...size(tiny, 1.3), textTransform: "uppercase", letterSpacing: 0.9, color: P.onAccent, opacity: 0.7, marginTop: 8 },
    sideValue: { fontWeight: 700, ...size(fs, 1.3), color: P.onAccent },
    sideTotal: { marginTop: 22, paddingTop: 12, borderTopWidth: 0.8, borderTopColor: P.onAccent },
    sideAmount: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 7, 1.2), color: P.onAccent },
    sidePage: { position: "absolute", top: A4_HEIGHT - 40, left: 18, ...size(7.5, 1.3), color: P.onAccent, opacity: 0.75 },
    sideTitle: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 16.5, 1.1), letterSpacing: -0.3 },
    sideSubject: { ...size(fs + 2.5, 1.3), color: P.muted, marginTop: 6 },
    // parties
    partiesRow: { flexDirection: "row", marginTop: 24, gap: 18 },
    party: { flex: 1 },
    clientCard: { backgroundColor: P.tint, borderRadius: r, padding: 11, borderLeftWidth: tk.layout === "letterhead" ? 3 : 0, borderLeftColor: P.accent },
    partyName: { fontWeight: 600, ...size(fs + 1.5, 1.3), marginTop: 3, marginBottom: 1 },
    partyLine: { color: P.muted },
    subject: { marginTop: 16, flexDirection: "row", alignItems: "baseline" },
    subjectLabel: { color: P.muted, marginRight: 6 },
    subjectValue: { fontWeight: 600, ...size(fs + 1, 1.3), flex: 1 },
    intro: { marginTop: 12 },
    // table
    table: { marginTop: 14 },
    th: { flexDirection: "row", ...size(tiny, 1.3), textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, paddingVertical: 7, paddingHorizontal: 8 },
    thFilled: { backgroundColor: P.accent, color: P.onAccent, borderTopLeftRadius: r, borderTopRightRadius: r },
    thRule: { color: P.muted, borderBottomWidth: 1.5, borderBottomColor: mono ? P.ink : P.accent },
    thDouble: { color: P.ink, borderTopWidth: 0.8, borderBottomWidth: 0.8, borderColor: P.ink },
    tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 0.8, borderBottomColor: P.rule },
    trAlt: { backgroundColor: P.tint },
    cellIdx: { width: 22, color: P.deep, fontWeight: 700, ...size(small, 1.4) },
    cellDesc: { flex: 1, paddingRight: 8 },
    cellQty: { width: 50 * cw, textAlign: "right" },
    cellPrice: { width: 72 * cw, textAlign: "right" },
    cellDisc: { width: 44 * cw, textAlign: "right" },
    cellVat: { width: 38 * cw, textAlign: "right" },
    cellAmount: { width: 80 * cw, textAlign: "right", fontWeight: mono ? 400 : 600 },
    descTitle: { fontWeight: 600 },
    descDetails: { color: P.muted, ...size(small, 1.35), marginTop: 2 },
    // totals
    totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
    totals: { width: 272 },
    totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 8 },
    totalLabel: { color: P.muted, flex: 1, paddingRight: 8 },
    totalValue: { fontWeight: 600 },
    totalStrong: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 8, borderTopWidth: 0.8, borderTopColor: P.ink, marginTop: 3 },
    totalStrongText: { fontWeight: 700, ...size(fs + 1.5, 1.3) },
    headline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: r },
    headlineFilled: { backgroundColor: P.accent, color: P.onAccent },
    headlinePanel: { backgroundColor: P.tint, color: P.deep },
    headlineOutline: { borderWidth: 1.2, borderColor: P.accent, color: P.deep },
    headlineRule: { borderTopWidth: 1.5, borderTopColor: P.accent, borderRadius: 0, paddingHorizontal: 8, color: P.deep },
    headlineLabel: { fontWeight: 700, ...size(fs + 1, 1.3) },
    headlineValue: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 5, 1.3) },
    // text blocks
    sections: { marginTop: 22, flexDirection: "row", gap: 20 },
    section: { flex: 1 },
    sectionBody: { marginTop: 3 },
    legal: { marginTop: 14, color: P.muted, ...size(small - 0.5, 1.35) },
    closing: { marginTop: 16, paddingTop: 10, borderTopWidth: 0.8, borderTopColor: P.rule },
    acceptance: { marginTop: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    validity: { color: P.muted, ...size(small - 0.5, 1.3), width: 230 },
    acceptanceBox: { width: 230, borderTopWidth: 0.8, borderTopColor: P.ink, paddingTop: 5, color: P.muted, ...size(small - 0.5, 1.3) },
    footer: {
      position: "absolute",
      // Anchored from the top on purpose: with lineHeight set on the page,
      // react-pdf places a fixed `bottom`-anchored block thousands of points
      // above the sheet (footer and page numbers vanished). The page is always A4.
      top: A4_HEIGHT - 38,
      left: padLeft,
      right: tk.layout === "sidebar" ? 32 : tk.margins.x,
      flexDirection: "row",
      justifyContent: "space-between",
      color: P.faint,
      ...size(7.5, 1.3),
    },
    watermark: {
      position: "absolute",
      top: 330,
      left: tk.layout === "sidebar" ? 170 : 70,
      fontFamily: fonts.display,
      fontWeight: 700,
      ...size(tk.layout === "sidebar" ? 62 : 78, 1),
      color: P.rule,
      opacity: 0.7,
      transform: "rotate(-30deg)",
      letterSpacing: 6,
    },
    // cover page
    coverPage: { fontFamily: fonts.body, fontSize: fs, color: P.ink, lineHeight: 1.35 },
    coverBand: { height: 190, paddingHorizontal: tk.margins.x, paddingTop: 44, backgroundColor: P.accent, color: P.onAccent },
    coverSender: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 8, 1.2), color: P.onAccent },
    coverLogo: { maxWidth: 170, maxHeight: 60, objectFit: "contain" },
    coverBody: { paddingHorizontal: tk.margins.x, paddingTop: 60 },
    coverTitle: { fontFamily: fonts.display, fontWeight: 700, ...size(fs + 24, 1.12), marginTop: 10, color: P.deep },
    coverSubtitle: { color: P.muted, ...size(fs + 4, 1.3), marginTop: 10 },
    coverImage: { width: 595.28 - 2 * tk.margins.x, height: 230, objectFit: "contain", marginTop: 28 },
    coverMeta: { marginTop: 36, borderTopWidth: 0.8, borderTopColor: P.rule, paddingTop: 12 },
    coverMetaRow: { flexDirection: "row", marginBottom: 3 },
    coverMetaLabel: { width: 120, color: P.muted },
    coverMetaValue: { fontWeight: 600 },
    coverFooter: { position: "absolute", top: A4_HEIGHT - 60, left: tk.margins.x, right: tk.margins.x, color: P.faint, ...size(7.5, 1.3) },
  });
  return st;
}

type Sheet = ReturnType<typeof buildStyles>;
type ViewStyle = React.ComponentProps<typeof View>["style"];
type TextStyle = ViewStyle;

type Ctx = {
  quote: Quote;
  d: ResolvedDesign;
  L: DocLabels;
  P: Palette;
  st: Sheet;
  t: Totals;
  money: (n: number) => string;
  /** Italic exists only for the serif families of the masthead layout */
  italic: TextStyle;
  senderName: string;
  title: string;
};

type Props = { quote: Quote; watermark: boolean; /** Public site URL, printed as a link in the footer of free (watermarked) PDFs */ siteUrl?: string };

function partyRows(party: Party, L: DocLabels): string[] {
  return [
    ...addressLines(party),
    party.vat ? `${L.vat} ${party.vat}` : "",
    party.taxCode ? `${L.taxCode} ${party.taxCode}` : "",
    party.email ?? "",
    party.phone ? `${L.phone} ${party.phone}` : "",
    party.pec ? `${L.pec} ${party.pec}` : "",
    party.sdi ? `${L.sdi} ${party.sdi}` : "",
    party.website ?? "",
  ]
    .map(s)
    .filter(Boolean);
}

function PartyBlock({ party, label, style, c }: { party: Party; label: string; style?: ViewStyle; c: Ctx }) {
  const { st, L } = c;
  return (
    <View style={style ? [st.party, style] : st.party}>
      <Text style={st.label}>{label}</Text>
      <Text style={st.partyName}>{s(party.name) || "—"}</Text>
      {partyRows(party, L).map((l, i) => (
        <Text key={i} style={st.partyLine}>
          {l}
        </Text>
      ))}
    </View>
  );
}

function MetaRows({ c }: { c: Ctx }) {
  const { quote, L, st } = c;
  const rows: [string, string][] = [
    [L.number, s(quote.number)],
    [L.date, formatDate(quote.date, quote.lang)],
    [L.validUntil, formatDate(validUntil(quote), quote.lang)],
  ];
  return (
    <View>
      {rows.map(([k, v]) => (
        <View key={k} style={st.metaRow}>
          <Text style={st.metaLabel}>{k}</Text>
          <Text style={st.metaValue}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

/** The sender's mark: the logo, or the initials in a badge when the style asks for one, or just the name. */
function Brand({ c, onAccent, nameStyle }: { c: Ctx; onAccent: boolean; nameStyle: TextStyle }) {
  const { quote, d, P, st, senderName } = c;
  const logo = quote.branding.logo;
  if (logo) {
    const img = (
      // eslint-disable-next-line jsx-a11y/alt-text
      <Image src={logo} style={st.logo} />
    );
    return onAccent ? <View style={st.logoCard}>{img}</View> : img;
  }
  const initials = d.tokens.monogram ? monogram(senderName) : "";
  if (!initials) return senderName ? <Text style={nameStyle}>{senderName}</Text> : null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <View style={[st.badge, { backgroundColor: onAccent ? P.onAccent : P.accent }]}>
        <Text style={[st.badgeText, { color: onAccent ? P.accent : P.onAccent }]}>{initials}</Text>
      </View>
      {senderName ? <Text style={[nameStyle, { flex: 1 }]}>{senderName}</Text> : null}
    </View>
  );
}

function Header({ c }: { c: Ctx }) {
  const { quote, d, L, P, st, t, money, italic, senderName, title } = c;
  const tk = d.tokens;
  const lang = quote.lang;
  const number = s(quote.number);
  const date = formatDate(quote.date, lang);
  const valid = formatDate(validUntil(quote), lang);
  switch (tk.layout) {
    case "hero": {
      const head = headlineAmount(t, L);
      const contact = [senderName, ...addressLines(quote.sender).map(s), s(quote.sender.email), s(quote.sender.phone)].filter(Boolean).join(" · ");
      return (
        <>
          <View style={st.heroBand}>
            <View style={st.headerRow}>
              <View style={{ maxWidth: 280 }}>
                <Brand c={c} onAccent nameStyle={[st.display, st.bold, size(tk.fontSize + 6, 1.2), { color: P.onAccent }]} />
              </View>
              <View>
                <Text style={st.heroTitle}>{L.quote}</Text>
                <Text style={st.heroMeta}>
                  {L.number} {number} · {L.date} {date}
                </Text>
                <Text style={st.heroMeta}>
                  {L.validUntil} {valid}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              <Text style={st.heroContact}>{contact}</Text>
              {tk.heroTotal ? (
                <View>
                  <Text style={st.heroAmountLabel}>{head.label}</Text>
                  <Text style={st.heroAmount}>{money(head.value)}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={{ height: HERO_HEIGHT - tk.margins.top + 4 }} />
        </>
      );
    }
    case "swiss":
      return (
        <>
          <View style={st.headerRow}>
            <View style={{ flex: 1, paddingRight: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 7, height: 7, backgroundColor: P.accent, marginRight: 7 }} />
                <Text style={st.kicker}>{title ? `${L.quote} · ${number}` : `${L.number} ${number}`}</Text>
              </View>
              <Text style={st.swissTitle}>{title || L.quote}</Text>
            </View>
            <View style={{ alignItems: "flex-end", maxWidth: 200 }}>
              <Brand c={c} onAccent={false} nameStyle={[st.semibold, size(tk.fontSize + 2.5, 1.25), { textAlign: "right" }]} />
            </View>
          </View>
          <View style={st.metaGrid}>
            {(
              [
                [L.number, number],
                [L.date, date],
                [L.validUntil, valid],
              ] as const
            ).map(([k, v]) => (
              <View key={k} style={st.metaCell}>
                <Text style={st.label}>{k}</Text>
                <Text style={st.semibold}>{v}</Text>
              </View>
            ))}
          </View>
        </>
      );
    case "masthead":
      return (
        <>
          <View style={st.masthead}>
            <Brand c={c} onAccent={false} nameStyle={st.mastheadSender} />
            <View style={st.shortRule} />
            <Text style={st.mastheadTitle}>{L.quote}</Text>
            <Text style={[st.mastheadMeta, italic]}>
              {L.number} {number} · {L.date} {date} · {L.validUntil} {valid}
            </Text>
          </View>
          <View style={st.doubleRule} />
        </>
      );
    case "dense":
      return (
        <>
          <View style={st.stripe} fixed />
          <View style={[st.headerRow, { alignItems: "center" }]}>
            <View style={{ maxWidth: 260 }}>
              <Brand c={c} onAccent={false} nameStyle={[st.display, st.bold, size(tk.fontSize + 4, 1.2), { color: P.deep }]} />
            </View>
            <View>
              <Text style={st.denseTitle}>{L.quote}</Text>
              <Text style={st.denseMeta}>
                {L.number} <Text style={[st.semibold, { color: P.ink }]}>{number}</Text> · {L.date} <Text style={[st.semibold, { color: P.ink }]}>{date}</Text> · {L.validUntil}{" "}
                <Text style={[st.semibold, { color: P.ink }]}>{valid}</Text>
              </Text>
            </View>
          </View>
          <View style={[st.hairline, { marginTop: 10 }]} />
        </>
      );
    case "sidebar": {
      const head = headlineAmount(t, L);
      return (
        <>
          <View style={st.sidebar} fixed>
            <Brand c={c} onAccent nameStyle={st.sideSender} />
            {quote.branding.logo && senderName ? <Text style={st.sideSender}>{senderName}</Text> : null}
            <View style={{ marginTop: 6 }}>
              {partyRows(quote.sender, L).map((l, i) => (
                <Text key={i} style={st.sideLine}>
                  {l}
                </Text>
              ))}
            </View>
            <View style={{ marginTop: 16 }}>
              {(
                [
                  [L.number, number],
                  [L.date, date],
                  [L.validUntil, valid],
                ] as const
              ).map(([k, v]) => (
                <View key={k}>
                  <Text style={st.sideLabel}>{k}</Text>
                  <Text style={st.sideValue}>{v}</Text>
                </View>
              ))}
            </View>
            {tk.heroTotal ? (
              <View style={st.sideTotal}>
                <Text style={[st.sideLabel, { marginTop: 0 }]}>{head.label}</Text>
                <Text style={st.sideAmount}>{money(head.value)}</Text>
              </View>
            ) : null}
            <Text style={st.sidePage} render={({ pageNumber, totalPages }) => `${L.page} ${pageNumber} ${L.of} ${totalPages}`} fixed />
          </View>
          <Text style={st.sideTitle}>{L.quote}</Text>
          {title ? <Text style={st.sideSubject}>{title}</Text> : null}
        </>
      );
    }
    default:
      return (
        <>
          <View style={st.headerRow}>
            <View style={{ maxWidth: 280 }}>
              <Brand c={c} onAccent={false} nameStyle={st.senderName} />
            </View>
            <View>
              <Text style={st.docTitle}>{L.quote}</Text>
              <MetaRows c={c} />
            </View>
          </View>
          <View style={st.letterheadRule}>
            <View style={{ width: 64, height: 3, backgroundColor: P.accent }} />
            <View style={{ flex: 1, height: 1, backgroundColor: P.line, marginTop: 1 }} />
          </View>
        </>
      );
  }
}

function Parties({ c }: { c: Ctx }) {
  const { quote, d, L, st } = c;
  const tk = d.tokens;
  if (tk.layout === "sidebar") {
    return (
      <View style={[st.partiesRow, { marginTop: 20 }]}>
        <PartyBlock party={quote.client} label={L.to} c={c} />
        <View style={st.party} />
      </View>
    );
  }
  return (
    <View style={st.partiesRow}>
      <PartyBlock party={quote.sender} label={L.from} c={c} />
      <PartyBlock party={quote.client} label={L.to} c={c} style={tk.clientCard ? st.clientCard : undefined} />
    </View>
  );
}

function ItemsTable({ c }: { c: Ctx }) {
  const { quote, d, L, st, t, money } = c;
  const tk = d.tokens;
  const cols = d.columns;
  const lang = quote.lang;
  const showDiscountCol = quote.items.some((i) => (i.discountPct ?? 0) > 0);
  const thVariant = tk.tableHeader === "filled" ? st.thFilled : tk.tableHeader === "double" ? st.thDouble : st.thRule;
  return (
    <View style={st.table}>
      <View style={[st.th, thVariant]} fixed>
        {tk.numbered ? <Text style={{ width: 22 }}> </Text> : null}
        <Text style={st.cellDesc}>{L.description}</Text>
        {cols.qty ? <Text style={st.cellQty}>{L.qty}</Text> : null}
        {cols.unitPrice ? <Text style={st.cellPrice}>{L.unitPrice}</Text> : null}
        {showDiscountCol ? <Text style={st.cellDisc}>{L.discount}</Text> : null}
        {cols.vat ? <Text style={st.cellVat}>{L.vatRate}</Text> : null}
        <Text style={[st.cellAmount, { fontWeight: 600 }]}>{L.amount}</Text>
      </View>
      {quote.items.map((it, idx) => {
        const lt = t.lines[idx];
        const qty = `${formatNumber(it.quantity, lang, 3)}${it.unit ? ` ${s(it.unit)}` : ""}`;
        return (
          <View key={it.id} style={tk.zebra && idx % 2 === 1 ? [st.tr, st.trAlt] : st.tr} wrap={false}>
            {tk.numbered ? <Text style={st.cellIdx}>{itemIndex(idx)}</Text> : null}
            <View style={st.cellDesc}>
              <Text style={st.descTitle}>{s(it.description) || "—"}</Text>
              {it.details ? <Text style={[st.descDetails, c.italic]}>{s(it.details)}</Text> : null}
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
  );
}

function TotalLine({ c, label, value }: { c: Ctx; label: string; value: string }) {
  return (
    <View style={c.st.totalLine}>
      <Text style={c.st.totalLabel}>{label}</Text>
      <Text style={c.st.totalValue}>{value}</Text>
    </View>
  );
}

/** The amount the client pays, highlighted the way the style asks for. */
function Headline({ c, label, value }: { c: Ctx; label: string; value: string }) {
  const { st, d } = c;
  const tk = d.tokens;
  const variant = tk.payable === "filled" ? st.headlineFilled : tk.payable === "panel" ? st.headlinePanel : tk.payable === "outline" ? st.headlineOutline : st.headlineRule;
  return (
    <View style={[st.headline, variant]}>
      <Text style={st.headlineLabel}>{label}</Text>
      <Text style={st.headlineValue}>{value}</Text>
    </View>
  );
}

function TotalsBlock({ c }: { c: Ctx }) {
  const { quote, L, st, t, money } = c;
  const lang = quote.lang;
  return (
    <View style={st.totalsRow} wrap={false}>
      <View style={st.totals}>
        {t.lineDiscounts > 0 || t.globalDiscount > 0 ? <TotalLine c={c} label={L.subtotal} value={money(t.subtotal)} /> : null}
        {t.lineDiscounts > 0 ? <TotalLine c={c} label={L.lineDiscounts} value={`-${money(t.lineDiscounts)}`} /> : null}
        {t.globalDiscount > 0 ? <TotalLine c={c} label={`${L.globalDiscount} ${formatPct(quote.options.globalDiscountPct, lang)}`} value={`-${money(t.globalDiscount)}`} /> : null}
        <TotalLine c={c} label={L.net} value={money(t.net)} />
        {t.rivalsa > 0 ? (
          <>
            <TotalLine c={c} label={s(rivalsaCaption(quote.options, lang))} value={money(t.rivalsa)} />
            <TotalLine c={c} label={L.taxable} value={money(t.taxable)} />
          </>
        ) : null}
        {t.vatGroups.map((g) => (
          <TotalLine key={g.rate} c={c} label={`${L.vatOn} ${formatNumber(g.rate, lang)}%${t.vatGroups.length > 1 ? ` (${money(g.base)})` : ""}`} value={money(g.vat)} />
        ))}
        {t.bollo > 0 ? <TotalLine c={c} label={L.bollo} value={money(t.bollo)} /> : null}
        {t.ritenuta > 0 ? (
          <>
            <View style={st.totalStrong}>
              <Text style={st.totalStrongText}>{L.total}</Text>
              <Text style={st.totalStrongText}>{money(t.total)}</Text>
            </View>
            <TotalLine c={c} label={`${L.ritenuta} ${formatPct(quote.options.ritenutaAccontoPct, lang)}`} value={`-${money(t.ritenuta)}`} />
            <Headline c={c} label={L.netPayable} value={money(t.netPayable)} />
          </>
        ) : (
          <Headline c={c} label={L.total} value={money(t.total)} />
        )}
        {t.deposit > 0 ? <TotalLine c={c} label={`${L.deposit} (${formatPct(quote.options.depositPct, lang)})`} value={money(t.deposit)} /> : null}
      </View>
    </View>
  );
}

function Cover({ c, watermarkEl }: { c: Ctx; watermarkEl: React.ReactNode }) {
  const { quote, d, L, P, st, italic, senderName, title } = c;
  const cover = d.cover;
  if (!cover) return null;
  const tk = d.tokens;
  const lang = quote.lang;
  const centered = tk.layout === "masthead";
  const band = !(tk.layout === "swiss" || tk.layout === "masthead");
  const contact = [senderName, ...addressLines(quote.sender).map(s), s(quote.sender.email), s(quote.sender.phone)].filter(Boolean).join(" · ");
  /** The cover title falls back to the subject, then to the document title */
  const coverTitle = s(cover.title) || title || L.quote;
  const meta: [string, string][] = [
    [L.to, s(quote.client.name) || "—"],
    [L.date, formatDate(quote.date, lang)],
    [L.validUntil, formatDate(validUntil(quote), lang)],
  ];
  return (
    <Page size="A4" style={st.coverPage}>
      {watermarkEl}
      {band ? (
        <View style={st.coverBand}>
          <Brand c={c} onAccent nameStyle={st.coverSender} />
        </View>
      ) : null}
      <View style={[st.coverBody, centered ? { alignItems: "center", paddingTop: 120 } : band ? {} : { paddingTop: 90 }]}>
        {!band && !centered ? <View style={{ width: 10, height: 10, backgroundColor: P.accent, marginBottom: 18 }} /> : null}
        {!band ? (
          <View style={[{ marginBottom: 26 }, centered ? { alignItems: "center" } : {}]}>
            <Brand c={c} onAccent={false} nameStyle={centered ? st.mastheadSender : [st.semibold, size(tk.fontSize + 3, 1.25)]} />
            {centered ? <View style={st.shortRule} /> : null}
          </View>
        ) : null}
        <Text style={[st.kicker, centered ? { textAlign: "center" } : {}]}>{coverTitle === L.quote ? `${L.number} ${s(quote.number)}` : `${L.quote} ${s(quote.number)}`}</Text>
        <Text style={[st.coverTitle, centered ? { textAlign: "center", letterSpacing: 0.5 } : {}]}>{coverTitle}</Text>
        {cover.subtitle ? <Text style={[st.coverSubtitle, italic, centered ? { textAlign: "center" } : {}]}>{s(cover.subtitle)}</Text> : null}
        {cover.image ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={cover.image} style={st.coverImage} />
        ) : null}
        {centered ? <View style={[st.doubleRule, { width: 180, marginTop: 30 }]} /> : null}
        <View style={[st.coverMeta, centered ? { borderTopWidth: 0, alignItems: "center" } : {}]}>
          {meta.map(([k, v]) => (
            <View key={k} style={st.coverMetaRow}>
              <Text style={[st.coverMetaLabel, centered ? { width: "auto", marginRight: 8 } : {}]}>{k}</Text>
              <Text style={st.coverMetaValue}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[st.coverFooter, centered ? { textAlign: "center" } : {}]}>
        <Text>{contact}</Text>
      </View>
    </Page>
  );
}

function sanitizeLabels(labels: DocLabels): DocLabels {
  return Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, s(v)])) as DocLabels;
}

export function QuoteDocument({ quote, watermark, siteUrl }: Props) {
  const d = resolveDesign(quote);
  const tk = d.tokens;
  const fonts: Fonts = { body: pdfFamily(tk.font), display: pdfFamily(tk.display) };
  const L = sanitizeLabels(d.labels);
  const P = d.palette;
  const st = buildStyles(d, fonts);
  const t = computeTotals(quote);
  const lang = quote.lang;
  const c: Ctx = {
    quote,
    d,
    L,
    P,
    st,
    t,
    money: (n: number) => formatMoney(n, quote.currency, lang),
    italic: tk.layout === "masthead" ? { fontStyle: "italic" } : {},
    senderName: s(quote.sender.name),
    title: s(quote.subject),
  };
  const hasExempt = t.vatGroups.some((g) => g.rate === 0);
  const occasionale = !quote.options.regimeForfettario && Boolean(quote.options.prestazioneOccasionale);
  const siteHost = siteUrl ? siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
  const siteLink = siteUrl ? `${siteUrl.replace(/\/$/, "")}/?utm_source=pdf&utm_medium=footer` : undefined;
  /** The swiss layout already prints the subject as its headline */
  const subjectRow = c.title && tk.layout !== "swiss" && tk.layout !== "sidebar";

  const watermarkEl = watermark ? (
    <Text style={st.watermark} fixed>
      {L.preview}
    </Text>
  ) : null;

  return (
    <Document title={`${L.quote} ${s(quote.number)}`} author={c.senderName || BRAND} subject={c.title} creator={BRAND} producer={BRAND} language={lang}>
      <Cover c={c} watermarkEl={watermarkEl} />

      <Page size="A4" style={st.page}>
        <Header c={c} />
        {watermarkEl}

        <Parties c={c} />

        {subjectRow ? (
          <View style={st.subject}>
            <Text style={st.subjectLabel}>{L.subject}:</Text>
            <Text style={st.subjectValue}>{c.title}</Text>
          </View>
        ) : null}

        {d.intro ? <Text style={st.intro}>{s(d.intro)}</Text> : null}

        <ItemsTable c={c} />
        <TotalsBlock c={c} />

        {/* Notes & terms: short texts stay with their headings on one page */}
        {quote.notes || quote.paymentTerms ? (
          <View style={st.sections} wrap={(quote.notes?.length ?? 0) + (quote.paymentTerms?.length ?? 0) > 900}>
            {quote.notes ? (
              <View style={st.section}>
                <View minPresenceAhead={50}>
                  <Text style={st.label}>{L.notes}</Text>
                </View>
                <Text style={st.sectionBody}>{s(quote.notes)}</Text>
              </View>
            ) : null}
            {quote.paymentTerms ? (
              <View style={st.section}>
                <View minPresenceAhead={50}>
                  <Text style={st.label}>{L.paymentTerms}</Text>
                </View>
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
            <Text>{s(d.closing)}</Text>
          </View>
        ) : null}

        {/* Acceptance */}
        {d.showSignature || d.showValidity ? (
          <View style={st.acceptance} wrap={false}>
            <View style={st.validity}>
              {d.showValidity ? (
                <Text>
                  {L.validUntil} {formatDate(validUntil(quote), lang)}
                </Text>
              ) : null}
            </View>
            {d.showSignature ? (
              <View style={st.acceptanceBox}>
                <Text style={[st.semibold, { color: P.ink }]}>{L.acceptance}</Text>
                <Text>{L.signature}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        <View style={st.footer} fixed>
          {watermark ? (
            // A Link must sit inside a Text: on its own in a fixed View it breaks the layout.
            <Text>
              {siteLink ? (
                <Link src={siteLink} style={{ color: P.faint, textDecoration: "none" }}>
                  {L.generatedWith} · {siteHost}
                </Link>
              ) : (
                L.generatedWith
              )}
            </Text>
          ) : (
            <Text>{c.senderName}</Text>
          )}
          {tk.layout === "sidebar" ? <Text> </Text> : <Text render={({ pageNumber, totalPages }) => `${L.page} ${pageNumber} ${L.of} ${totalPages}`} />}
        </View>
      </Page>
    </Document>
  );
}
