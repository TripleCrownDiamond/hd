import "server-only";

import { createHash } from "node:crypto";
import { getMigrationAwareServiceSupabase } from "@/lib/db/server";

interface Source { title: string; href: string; excerpt: string }

async function retrieveContext(question: string): Promise<Source[]> {
  const supabase = getMigrationAwareServiceSupabase();
  const terms = question.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 3).slice(0, 6);
  const [{ data: faq }, { data: products }, { data: pages }] = await Promise.all([
    supabase.from("faq_entries").select("question,answer").eq("status", "published").limit(60),
    supabase.from("products").select("slug,model,short_description,long_description,kind,price_cents_public,quote_mode").eq("is_published", true).eq("review_status", "approved").limit(120),
    supabase.from("content_entries").select("slug,title,excerpt,body").eq("status", "published").limit(40),
  ]);
  const candidates: Source[] = [
    ...(faq ?? []).map((row) => ({ title: row.question as string, href: "/faq", excerpt: row.answer as string })),
    ...(products ?? []).map((row) => ({ title: row.model as string, href: `/produkt/${row.slug}`, excerpt: `${row.short_description ?? ""} ${row.long_description ?? ""} Preis: ${row.quote_mode ? "auf Anfrage" : `${((row.price_cents_public as number) / 100).toFixed(2)} EUR`}` })),
    ...(pages ?? []).map((row) => ({ title: row.title as string, href: `/${row.slug}`, excerpt: String(row.excerpt ?? row.body ?? "").replace(/<[^>]+>/g, " ") })),
  ];
  return candidates.map((source) => ({ source, score: terms.reduce((score, term) => score + (`${source.title} ${source.excerpt}`.toLowerCase().includes(term) ? 1 : 0), 0) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 6).map(({ source }) => ({ ...source, excerpt: source.excerpt.slice(0, 1200) }));
}

export async function answerChat(input: { sessionToken: string; message: string; path: string }) {
  const supabase = getMigrationAwareServiceSupabase();
  const sessionHash = createHash("sha256").update(input.sessionToken).digest("hex");
  const { data: existing } = await supabase.from("conversations").select("id,status").eq("session_token_hash", sessionHash).maybeSingle();
  let conversationId = existing?.id as string | undefined;
  if (!conversationId) {
    const { data, error } = await supabase.from("conversations").insert({ session_token_hash: sessionHash, context_path: input.path }).select("id").single();
    if (error || !data) throw new Error("Conversation unavailable"); conversationId = data.id as string;
  }
  await supabase.from("conversation_messages").insert({ conversation_id: conversationId, role: "user", content: input.message });
  const sources = await retrieveContext(input.message);
  const apiKey = process.env.MISTRAL_API_KEY;
  let answer: string;
  let model: string | null = null;
  if (!apiKey) {
    answer = sources.length ? `Ich habe passende Informationen gefunden: ${sources.map((source) => source.title).join(", ")}. Bitte öffnen Sie die verlinkten Quellen. Für eine persönliche Beratung nutzen Sie bitte die Kontaktseite.` : "Dazu finde ich in den freigegebenen Shop-Informationen noch keine sichere Antwort. Bitte nutzen Sie die FAQ oder kontaktieren Sie unseren Service.";
  } else {
    model = process.env.MISTRAL_CHAT_MODEL || "mistral-small-latest";
    const context = sources.map((source, index) => `[${index + 1}] ${source.title}\n${source.excerpt}\nURL: ${source.href}`).join("\n\n");
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model, temperature: 0.1, safe_prompt: true, max_tokens: 500, messages: [{ role: "system", content: "Du bist der digitale HolzDirekt-Assistent. Antworte auf Deutsch, knapp und hilfreich. Verwende ausschließlich den bereitgestellten, redaktionell freigegebenen Kontext. Erfinde niemals Preise, Lieferzeiten, Verfügbarkeit, technische, rechtliche oder steuerliche Angaben. Wenn der Kontext nicht reicht, sage das offen und verweise auf Kontakt/FAQ. Du bist eine KI und keine Rechts- oder Fachberatung." }, { role: "user", content: `Aktuelle Seite: ${input.path}\nFrage: ${input.message}\n\nFreigegebener Kontext:\n${context || "Kein passender Kontext."}` }] }) });
    if (!response.ok) throw new Error("Mistral unavailable");
    const json = await response.json() as { choices?: { message?: { content?: string } }[] };
    answer = json.choices?.[0]?.message?.content?.trim() || "Ich kann diese Frage gerade nicht sicher beantworten. Bitte nutzen Sie unsere Kontaktseite.";
  }
  await supabase.from("conversation_messages").insert({ conversation_id: conversationId, role: "assistant", content: answer, sources: sources.map(({ title, href }) => ({ title, href })), model });
  await supabase.from("conversations").update({ context_path: input.path, last_message_at: new Date().toISOString() }).eq("id", conversationId);
  return { answer, sources: sources.map(({ title, href }) => ({ title, href })) };
}
