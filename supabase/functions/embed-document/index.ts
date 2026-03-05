import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CONTENT_LENGTH = 100_000; // ~100k chars max
const MAX_CHUNKS = 50;

function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length && chunks.length < MAX_CHUNKS) {
    let end = start + chunkSize;

    if (end < text.length) {
      const slice = text.slice(start, end + 200);
      const paragraphBreak = slice.lastIndexOf("\n\n");
      const sentenceBreak = slice.lastIndexOf(". ");
      if (paragraphBreak > chunkSize * 0.5) {
        end = start + paragraphBreak + 2;
      } else if (sentenceBreak > chunkSize * 0.5) {
        end = start + sentenceBreak + 2;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    start = end - overlap;
  }
  return chunks;
}

async function getEmbeddingsWithRetry(texts: string[], apiKey: string, retries = 2): Promise<number[][]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: texts,
        }),
      });

      if (response.status === 429 && attempt < retries) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "2");
        console.warn(`Rate limited, retrying in ${retryAfter}s (attempt ${attempt + 1})`);
        await response.text(); // consume body
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenAI embeddings error:", response.status, err);
        if (attempt < retries && response.status >= 500) {
          console.warn(`Server error, retrying (attempt ${attempt + 1})`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`OpenAI embeddings error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.map((d: any) => d.embedding);
    } catch (e) {
      if (attempt < retries && !(e instanceof Error && e.message.includes("OpenAI embeddings error"))) {
        console.warn(`Network error, retrying (attempt ${attempt + 1}):`, e);
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error("Exhausted retries for embeddings");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { content, documentName, sessionId } = body;

    if (!content || !documentName || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing content, documentName, or sessionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate content is actually text with substance
    const trimmed = content.trim();
    if (trimmed.length < 50) {
      return new Response(
        JSON.stringify({ error: "Document content too short to index (minimum 50 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Truncate extremely large documents
    const safeContent = trimmed.length > MAX_CONTENT_LENGTH
      ? trimmed.slice(0, MAX_CONTENT_LENGTH)
      : trimmed;

    if (trimmed.length > MAX_CONTENT_LENGTH) {
      console.warn(`Document "${documentName}" truncated from ${trimmed.length} to ${MAX_CONTENT_LENGTH} chars`);
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Chunk the document
    const chunks = chunkText(safeContent);
    console.log(`Document "${documentName}": ${chunks.length} chunks created (${safeContent.length} chars)`);

    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No meaningful content could be extracted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Generate embeddings in small batches with retry
    const batchSize = 10; // Smaller batches = less likely to timeout
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await getEmbeddingsWithRetry(batch, OPENAI_API_KEY);
      allEmbeddings.push(...embeddings);
    }

    // 3. Delete existing chunks for this document + session
    const { error: deleteError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("session_id", sessionId)
      .eq("document_name", documentName);

    if (deleteError) {
      console.warn("Delete existing chunks warning:", deleteError);
    }

    // 4. Insert chunks with embeddings in batches
    const rows = chunks.map((chunk, i) => ({
      session_id: sessionId,
      document_name: documentName,
      chunk_index: i,
      content: chunk,
      embedding: JSON.stringify(allEmbeddings[i]),
    }));

    // Insert in batches of 20 to avoid payload limits
    for (let i = 0; i < rows.length; i += 20) {
      const batch = rows.slice(i, i + 20);
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        console.error("Insert error at batch", i, insertError);
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    console.log(`Document "${documentName}": successfully indexed ${chunks.length} chunks`);

    return new Response(
      JSON.stringify({
        success: true,
        chunksCreated: chunks.length,
        documentName,
        truncated: trimmed.length > MAX_CONTENT_LENGTH,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("embed-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
