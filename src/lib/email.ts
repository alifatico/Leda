import { emailEnv } from "./env";

/** Minimal Resend client (REST, no SDK). Returns false when e-mail is not configured. */
export async function sendEmail(args: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const key = emailEnv.resendApiKey();
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: emailEnv.from(), to: [args.to], subject: args.subject, html: args.html, text: args.text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${body.slice(0, 200)}`);
  }
  return true;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
