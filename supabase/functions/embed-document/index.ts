import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Split text into chunks of ~chunkSize characters with overlap
 */
function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a paragraph or sentence boundary
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

/**
 * Generate embeddings via OpenAI
 */
async function getEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
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

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI embeddings error:", response.status, err);
    throw new Error(`OpenAI embeddings error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.map((d: any) => d.embedding);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, documentName, sessionId } = await req.json();

    if (!content || !documentName || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing content, documentName, or sessionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Chunk the document
    const chunks = chunkText(content);
    console.log(`Document "${documentName}": ${chunks.length} chunks created`);

    // 2. Generate embeddings in batches of 20
    const batchSize = 20;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await getEmbeddings(batch, OPENAI_API_KEY);
      allEmbeddings.push(...embeddings);
    }

    // 3. Delete existing chunks for this document + session
    await supabase
      .from("document_chunks")
      .delete()
      .eq("session_id", sessionId)
      .eq("document_name", documentName);

    // 4. Insert chunks with embeddings
    const rows = chunks.map((chunk, i) => ({
      session_id: sessionId,
      document_name: documentName,
      chunk_index: i,
      content: chunk,
      embedding: JSON.stringify(allEmbeddings[i]),
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(rows);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert chunks: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunksCreated: chunks.length,
        documentName,
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
