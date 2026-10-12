import type { Quote } from "./types";

export type MissingField = "senderName" | "clientName" | "items" | "itemDescription";

/**
 * What a quote still needs before its PDF makes sense. The schema accepts empty
 * names (drafts autosave while typing); the document does not: the builder shows
 * these next to the download buttons and marks the fields with an asterisk.
 */
export function missingFields(q: Quote): MissingField[] {
  const out: MissingField[] = [];
  if (!q.sender.name.trim()) out.push("senderName");
  if (!q.client.name.trim()) out.push("clientName");
  if (q.items.length === 0) out.push("items");
  else if (q.items.some((i) => !i.description.trim())) out.push("itemDescription");
  return out;
}
