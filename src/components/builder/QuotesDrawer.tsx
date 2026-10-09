"use client";

import { useLocale } from "@/lib/i18n/context";
import { computeTotals, formatMoney } from "@/lib/quote";
import type { SavedTemplate, StoredQuote } from "@/lib/storage";
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
  templates,
  onUseTemplate,
  onDeleteTemplate,
}: {
  open: boolean;
  onClose: () => void;
  quotes: StoredQuote[];
  currentId: string | undefined;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  templates: SavedTemplate[];
  onUseTemplate: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
}) {
  const { t, locale } = useLocale();
  const fmtDate = (ms: number) => new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", { dateStyle: "medium" }).format(new Date(ms));
  return (
    <Modal open={open} onClose={onClose} title={t("b.myQuotes")}>
      <Button className="mb-3 w-full" onClick={onNew}>
        <Icon name="plus" className="h-4 w-4" /> {t("b.newQuote")}
      </Button>
      {templates.length > 0 ? (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("b.design.myTemplates")}</div>
          <ul className="divide-y divide-slate-200">
            {templates.map((tpl) => (
              <li key={tpl.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{tpl.name}</div>
                  <div className="truncate text-xs text-slate-500">
                    {tpl.data.subject || "—"} · {tpl.data.items.length} {t("b.sections.items").toLowerCase()} · {fmtDate(tpl.createdAt)}
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onUseTemplate(tpl.id)}>
                  {t("b.design.use")}
                </Button>
                <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => onDeleteTemplate(tpl.id)} title={t("b.delete")}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
                  {s.share?.status ? (
                    <Badge tone={s.share.status === "accepted" ? "green" : s.share.status === "declined" ? "amber" : "indigo"}>{t(`b.share.status.${s.share.status}`)}</Badge>
                  ) : null}
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
