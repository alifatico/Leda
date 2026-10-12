import { describe, expect, it } from "vitest";
import { missingFields } from "@/lib/quote";
import { sampleQuote } from "@/lib/quote/sample";

describe("missingFields", () => {
  it("accepts the sample quote", () => {
    expect(missingFields(sampleQuote("it"))).toEqual([]);
  });

  it("names what the document needs, in the order the editor shows them", () => {
    const q = sampleQuote("it");
    const empty = { ...q, sender: { ...q.sender, name: " " }, client: { ...q.client, name: "" }, items: [] };
    expect(missingFields(empty)).toEqual(["senderName", "clientName", "items"]);
    expect(missingFields({ ...q, items: [{ ...q.items[0], description: "  " }] })).toEqual(["itemDescription"]);
  });
});
