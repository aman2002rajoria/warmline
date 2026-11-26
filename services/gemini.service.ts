import { isTestMode, fakeLines } from "@/lib/test-mode";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSettings } from "@/lib/settings-store";
import { getCache, setCache } from "@/lib/cache-store";
import { logger } from "@/lib/logger";
import {
  DEFAULT_GEMINI_MODEL,
  normalizeGeminiModelId,
} from "@/lib/gemini-config";

export interface PersonalizationInput {
  email: string;
  professorName: string;
  university: string;
  department?: string | null;
  labWebsite?: string | null;
  researchArea?: string | null;
  notes?: string | null;
}

export interface PersonalizationResult {
  lines: string;
  model: string;
  generatedAt: string;
  fromCache: boolean;
}

const SYSTEM_PROMPT = `You are helping personalise cold outreach emails: to a possible customer, partner,
investor, guest, hire or mentor. The sender is writing to someone they don't know yet.

Your job: produce EXACTLY 2 (max 3) concise personal sentences that will be inserted into
a fixed email template right after the greeting.

STRICT RULES:
- Open with one real, specific thing about the person's work (the "hook"), taken only from the details given.
- Sound like a thoughtful person who did their homework, NOT marketing copy.
- Keep the tone warm, plain and concise.
- Avoid exaggerated praise ("groundbreaking", "world-class", "incredible", "deeply inspiring", "fascinating", etc.).
- Avoid stock phrases ("I am writing to express", "I hope this email finds you well", "I wanted to reach out").
- Do NOT invent facts, posts, talks, numbers or results. If the details are thin, stay general.
- Do NOT mention you used AI.
- Do NOT include greetings, sign-offs, the person's name or the ask (the template has those).
- Keep total output under 50 words.
- Return ONLY the 2-3 sentences as plain text. No quotes, no bullets, no labels, no markdown.`;

function buildUserPrompt(p: PersonalizationInput): string {
  const lines = [
    `Person: ${p.professorName}`,
    `Company or organisation: ${p.university}`,
  ];
  if (p.department) lines.push(`Role: ${p.department}`);
  if (p.researchArea) lines.push(`What they work on: ${p.researchArea}`);
  if (p.labWebsite) lines.push(`Link: ${p.labWebsite}`);
  if (p.notes) lines.push(`Sender's notes about them: ${p.notes}`);
  lines.push("", "Write the 2-3 personalized sentences now.");
  return lines.join("\n");
}

/** Google's errors, in plain words. */
export function friendlyGeminiError(err: unknown): string {
  const m = (err as Error)?.message || String(err);
  if (/API[_ ]?key|API_KEY_INVALID|\[400|\[401|\[403|PERMISSION_DENIED/i.test(m)) return "Google didn't accept that Gemini key. Check it in Settings.";
  if (/\[429|quota|RESOURCE_EXHAUSTED/i.test(m)) return "That Gemini key is out of free quota for now. Try again in a minute.";
  if (/fetch failed|ENOTFOUND|ECONN/i.test(m)) return "Couldn't reach Gemini. Check the connection and try again.";
  return m;
}

function sanitize(text: string): string {
  let t = text.trim();
  t = t.replace(/^(personalized\s+(lines|sentences)\s*:\s*)/i, "");
  if (
    (t.startsWith("\"") && t.endsWith("\"")) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  t = t.replace(/\n{2,}/g, " ").replace(/\s{2,}/g, " ").trim();
  return t;
}

export async function generatePersonalization(
  input: PersonalizationInput,
  opts: { force?: boolean; apiKey?: string } = {},
): Promise<PersonalizationResult> {
  // A visitor's own key (sent with this request from their browser, never saved): real Gemini lines,
  // even in the test-data demo. Without one, test mode writes canned lines.
  const ownKey = opts.apiKey?.trim();
  if (isTestMode() && !ownKey) {
    await new Promise((r) => setTimeout(r, 1200));
    return { lines: fakeLines(input), model: "test-mode", generatedAt: new Date().toISOString(), fromCache: false };
  }

  if (!opts.force && !ownKey) {
    const cached = getCache(input.email);
    if (cached) {
      return {
        lines: cached.lines,
        model: cached.model,
        generatedAt: cached.generatedAt,
        fromCache: true,
      };
    }
  }

  const s = getSettings();
  const key = ownKey || s.geminiApiKey;
  if (!key) {
    throw new Error(
      "No Gemini API key yet. Open Settings and paste your own key.",
    );
  }

  const modelId = normalizeGeminiModelId(s.geminiModel || DEFAULT_GEMINI_MODEL);
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 256 },
  });

  try {
    const result = await model.generateContent(buildUserPrompt(input));
    const cleaned = sanitize(result.response.text());
    if (!cleaned) throw new Error("Empty response from Gemini.");

    const out: PersonalizationResult = {
      lines: cleaned,
      model: modelId,
      generatedAt: new Date().toISOString(),
      fromCache: false,
    };
    if (!ownKey) setCache({
      email: input.email,
      lines: cleaned,
      model: modelId,
      generatedAt: out.generatedAt,
    });
    return out;
  } catch (err) {
    logger.error("Gemini generation failed", {
      professor: input.professorName,
      err: (err as Error).message,
    });
    throw new Error(friendlyGeminiError(err));
  }
}

/** Quick connectivity probe — used by the Test Configuration button. */
export async function pingGemini(apiKey?: string): Promise<{ ok: boolean; message: string }> {
  const s = getSettings();
  const key = apiKey?.trim() || s.geminiApiKey;
  if (!key) {
    return { ok: false, message: "Gemini API key is not set in Settings." };
  }
  try {
    const modelId = normalizeGeminiModelId(s.geminiModel || DEFAULT_GEMINI_MODEL);
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: { maxOutputTokens: 8 },
    });
    const r = await model.generateContent("Reply with the single word: OK");
    const text = r.response.text();
    if (text && text.length > 0) {
      return { ok: true, message: `Your key works (${modelId}).` };
    }
    return { ok: false, message: "Empty response from Gemini." };
  } catch (err) {
    return { ok: false, message: friendlyGeminiError(err) };
  }
}
