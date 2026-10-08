import { beforeAll, describe, expect, it } from "vitest";

process.env.SHARE_STORE = "memory";

import { createOrUpdateShare, decide, getShare, hashIp, markViewed, ownerView, revoke, ShareError, toPublic } from "@/lib/share";
import { sampleQuote } from "@/lib/quote";

describe("share service (memory store)", () => {
  beforeAll(() => {
    process.env.SHARE_STORE = "memory";
  });

  it("creates a link, tracks view and acceptance, hides secrets from the public view", async () => {
    const q = sampleQuote("it");
    const { record, url } = await createOrUpdateShare({ quote: q, notifyEmail: "me@studio.it" });
    expect(url).toContain(`/p/${record.id}`);
    expect(record.status).toBe("sent");
    expect(record.ownerKey).toHaveLength(24);

    await markViewed(record.id);
    const viewed = await getShare(record.id);
    expect(viewed?.status).toBe("viewed");

    const pub = toPublic(viewed!);
    expect("ownerKey" in pub).toBe(false);
    expect("notifyEmail" in pub).toBe(false);

    const decided = await decide(record.id, { decision: "accepted", name: "Gino Rossi", note: "ok", ipHash: hashIp("1.2.3.4") });
    expect(decided.status).toBe("accepted");
    expect(decided.decisionName).toBe("Gino Rossi");
    await expect(decide(record.id, { decision: "declined", name: "X Y", ipHash: "h" })).rejects.toBeInstanceOf(ShareError);

    const view = await ownerView(record.id, record.ownerKey);
    expect(view.status).toBe("accepted");
    expect("quote" in view).toBe(false);
    await expect(ownerView(record.id, "wrong-key")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("re-sharing an edited quote keeps the link but resets a previous decision", async () => {
    const q = sampleQuote("en");
    const first = await createOrUpdateShare({ quote: q });
    await decide(first.record.id, { decision: "declined", name: "Client", ipHash: "h" });
    const edited = { ...q, notes: "Revised offer" };
    const second = await createOrUpdateShare({ quote: edited, existing: { id: first.record.id, ownerKey: first.record.ownerKey } });
    expect(second.record.id).toBe(first.record.id);
    expect(second.record.revision).toBe(2);
    expect(second.record.status).toBe("sent");
    expect(second.record.decisionName).toBeUndefined();
    // same content again: no new revision
    const third = await createOrUpdateShare({ quote: edited, existing: { id: first.record.id, ownerKey: first.record.ownerKey } });
    expect(third.record.revision).toBe(2);
  });

  it("revokes only with the owner key", async () => {
    const { record } = await createOrUpdateShare({ quote: sampleQuote("it") });
    await expect(revoke(record.id, "nope")).rejects.toMatchObject({ code: "forbidden" });
    await revoke(record.id, record.ownerKey);
    expect(await getShare(record.id)).toBeNull();
  });

  it("ip hashes are salted per day and short", () => {
    expect(hashIp("1.1.1.1", "2026-10-08")).not.toBe(hashIp("1.1.1.1", "2026-10-09"));
    expect(hashIp("1.1.1.1")).toHaveLength(16);
  });
});
