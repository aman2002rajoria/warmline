import type { ExcelImportResult, ProfessorRecord } from "@/types";
import { keyHeader } from "@/lib/own-key";

/** Thin client for the app's own API routes. Throws with the server's message. */
async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export interface SendResult {
  attempted: number;
  sent: number;
  failed: number;
  details: { professorId: string; email: string; status: "sent" | "failed"; error?: string }[];
}

export const api = {
  list: () =>
    call<{ professors: ProfessorRecord[] }>("/api/professors").then((d) => d.professors),

  /** Ask Gemini for the personal lines and rebuild the draft. Uses the visitor's own key when they've added one. */
  writeDraft: (id: string, rewrite = false) =>
    call<{ professor: ProfessorRecord }>(
      `/api/professors/${id}/personalize${rewrite ? "?force=1" : ""}`,
      { method: "POST", headers: keyHeader() },
    ).then((d) => d.professor),

  create: (p: Partial<ProfessorRecord>) =>
    call<{ professor: ProfessorRecord }>("/api/professors", jsonInit("POST", p)).then((d) => d.professor),

  update: (id: string, patch: Partial<ProfessorRecord>) =>
    call<{ professor: ProfessorRecord }>(`/api/professors/${id}`, jsonInit("PATCH", patch)).then(
      (d) => d.professor,
    ),

  /** Rebuild subject and body from the current template and saved lines. */
  rebuild: (id: string) =>
    call<{ professor: ProfessorRecord }>(`/api/professors/${id}/draft`, { method: "POST" }).then(
      (d) => d.professor,
    ),

  send: (ids: string[]) =>
    call<SendResult & { ok: boolean }>("/api/email/send", jsonInit("POST", { professorIds: ids })),

  remove: (ids: string[]) =>
    call<{ deleted: number }>(`/api/professors?ids=${ids.map(encodeURIComponent).join(",")}`, {
      method: "DELETE",
    }),

  importSheet: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return call<ExcelImportResult & { ok: boolean }>("/api/excel/upload", {
      method: "POST",
      body: fd,
    });
  },
};
