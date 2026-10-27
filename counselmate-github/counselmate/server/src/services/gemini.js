import { env } from '../config/env.js';

/**
 * Calls the Gemini API. Returns the reply text, or null if anything goes wrong
 * (no key, quota used up, timeout, blocked answer). The caller then uses its basic mode,
 * so the chatbot never shows an error screen because of Gemini.
 * The key is sent in a header from the server only. It never reaches the browser.
 */
export async function askGemini({ systemInstruction, contents }) {
  if (!env.geminiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      console.warn('Gemini request failed, HTTP status', res.status);   // status only: never log the key or the prompt
      return null;
    }
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    return text || null;
  } catch (err) {
    console.warn('Gemini call failed:', err.name);
    return null;
  }
}
