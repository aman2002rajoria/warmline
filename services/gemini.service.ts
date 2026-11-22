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

const SYSTEM_PROMPT = `You are helping personalize research internship cold emails.

Your job: produce EXACTLY 2 (max 3) concise personalized sentences that will be
inserted into a fixed email template between the greeting and the rest of the body.

STRICT RULES:
- Mention the professor's research/lab focus naturally.
- Sound like a thoughtful undergraduate, NOT marketing copy.
- Keep tone formal, factual, concise.
- Avoid exaggerated praise ("groundbreaking", "world-class", "pioneering", "deeply inspiring", "fascinating", etc.).
- Avoid AI-sounding stock phrases ("I am writing to express", "I am reaching out because", "I would like to take this opportunity").
- Do NOT invent specific papers, results, datasets, or numbers. Stay general if you don't know specifics.
- Do NOT mention you used AI.
- Do NOT include greetings, closings, or the professor's name (those exist in the surrounding template).
- Keep total output under 60 words.
- Return ONLY the 2-3 sentences as plain text. No quotes, no bullets, no labels, no markdown.`;

function buildUserPrompt(p: PersonalizationInput): string {
  const lines = [
    `Professor: ${p.professorName}`,
    `University: ${p.university}`,
  ];
  if (p.department) lines.push(`Department: ${p.department}`);
  if (p.researchArea) lines.push(`Stated research area: ${p.researchArea}`);
  if (p.labWebsite) lines.push(`Lab website: ${p.labWebsite}`);
  if (p.notes) lines.push(`Extra notes provided by user: ${p.notes}`);
  lines.push("", "Write the 2-3 personalized sentences now.");
  return lines.join("\n");
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
  opts: { force?: boolean } = {},
): Promise<PersonalizationResult> {
  if (isTestMode()) {
    await new Promise((r) => setTimeout(r, 1200));
    return { lines: fakeLines(input), model: "test-mode", generatedAt: new Date().toISOString(), fromCache: false };
  }

  if (!opts.force) {
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
  if (!s.geminiApiKey) {
    throw new Error(
      "Gemini API key is not configured. Open Settings and paste your key.",
    );
  }

  const modelId = normalizeGeminiModelId(s.geminiModel || DEFAULT_GEMINI_MODEL);
  const genAI = new GoogleGenerativeAI(s.geminiApiKey);
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
    setCache({
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
    throw err;
  }
}

/** Quick connectivity probe — used by the Test Configuration button. */
export async function pingGemini(): Promise<{ ok: boolean; message: string }> {
  const s = getSettings();
  if (!s.geminiApiKey) {
    return { ok: false, message: "Gemini API key is not set in Settings." };
  }
  try {
    const modelId = normalizeGeminiModelId(s.geminiModel || DEFAULT_GEMINI_MODEL);
    const genAI = new GoogleGenerativeAI(s.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: { maxOutputTokens: 8 },
    });
    const r = await model.generateContent("Reply with the single word: OK");
    const text = r.response.text();
    if (text && text.length > 0) {
      return { ok: true, message: `Gemini reachable (${modelId}).` };
    }
    return { ok: false, message: "Empty response from Gemini." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}
