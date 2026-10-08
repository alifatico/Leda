"use client";

import { useLocale } from "@/lib/i18n/context";
import { computeTotals, formatMoney } from "@/lib/quote";
import type { StoredQuote } from "@/lib/storage";
import { Badge, Button, Icon, Modal } from "../ui";

export function QuotesDrawer({
  open,
  onClose,
  quotes,
  currentId,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  quotes: StoredQuote[];
  currentId: string | undefined;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t, locale } = useLocale();
  const fmtDate = (ms: number) => new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", { dateStyle: "medium" }).format(new Date(ms));
  return (
    <Modal open={open} onClose={onClose} title={t("b.myQuotes")}>
      <Button className="mb-3 w-full" onClick={onNew}>
        <Icon name="plus" className="h-4 w-4" /> {t("b.newQuote")}
      </Button>
      {quotes.length === 0 ? <p className="text-sm text-slate-500">{t("b.noQuotes")}</p> : null}
      <ul className="divide-y divide-slate-100">
        {quotes.map((s) => {
          const q = s.quote;
          const total = computeTotals(q).total;
          return (
            <li key={q.id} className={"flex items-center gap-3 py-2.5 " + (q.id === currentId ? "bg-indigo-50/60 -mx-2 px-2 rounded-lg" : "")}>
              <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(q.id)}>
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">{q.number}</span>
                  {s.unlock ? <Badge tone="green">{t("b.unlocked")}</Badge> : <Badge>{t("b.draft")}</Badge>}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {q.client.name || "—"} · {q.subject || ""}
                </div>
                <div className="text-xs text-slate-400">
                  {fmtDate(q.updatedAt)} · {formatMoney(total, q.currency, q.lang)}
                </div>
              </button>
              <button className="rounded p-1.5 text-slate-500 hover:bg-slate-100" onClick={() => onDuplicate(q.id)} title={t("b.duplicate")}>
                <Icon name="copy" className="h-4 w-4" />
              </button>
              <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => onDelete(q.id)} title={t("b.delete")}>
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
