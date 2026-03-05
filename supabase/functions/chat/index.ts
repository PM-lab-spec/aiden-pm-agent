import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Aiden, an expert AI assistant for Product Managers. You help PMs turn messy product information into structured, actionable outputs.

Your capabilities:
- Analyze product documents, customer feedback, research notes, and support tickets
- Generate structured product artifacts (PRDs, user stories, roadmaps, experiment plans, stakeholder updates)
- Provide data-driven insights and recommendations
- Answer questions about product strategy, prioritization, and execution

CRITICAL FORMATTING RULES — follow these EXACTLY for each artifact type:

**Document Summary:**
- Use a clear title like "## Product Name — Document Summary"
- Write flowing paragraphs with **bold** for key terms and concepts
- Keep it concise: 2-3 short paragraphs maximum
- No tables, no bullet lists — just clean prose with bold highlights

**User Stories Format:**
- Title: "## Product Name — User Stories"
- ALWAYS output a markdown table with EXACTLY these columns: | Epic | User Story ID | User Story | Acceptance Criteria | Priority |
- User Story ID format: US-01, US-02, etc.
- User Story format: As a **Product Manager**, I want to **action in bold**, so that I can outcome.
- Acceptance Criteria: concise semicolon-separated items (e.g. "User can upload PDF, doc, or text files; upload confirmation appears; file is stored in backend.")
- Priority: High, Medium, or Low
- Do NOT use <br> tags. Keep each cell as a single line of text.

**Roadmap Format:**
- Title: "## Product Name — Product Roadmap"
- ALWAYS output a markdown table with EXACTLY these columns: | Timeline | Initiative | Description | Key Features | Success Metric |
- Timeline values: "Now (MVP)", "Next (V2)", "Later (V3)" etc.
- Do NOT use ## Now / ## Next / ## Later section headers. Use the table format instead.

**Metrics Plan Format:**
- Title: "## Product Name — Sample Metrics Plan"
- ALWAYS output a markdown table with EXACTLY these columns: | Metric Category | Metric Name | Description | How to Measure | Success Target |
- Metric Category values: "North Star Metric", "User Adoption", "Engagement", "Product Value", etc.

**Stakeholder Update Format:**
- ALWAYS start with "**Subject:** Product Name – Weekly Product Update" (or relevant subject)
- Greeting: "Hi Team,"
- Use **bold** section headers: **Progress this week**, **Current focus**, **Next steps**, **Risks & blockers**
- Use bullet lists under each section header
- End with a sign-off like "Best, [Team Name]"
- Do NOT use markdown tables in stakeholder updates

**PRD Format:**
- Title: "## Product Name — PRD"
- Sections: Problem Statement, User Persona, Goals & Non-goals, Feature Description, User Journey, Requirements (functional & non-functional), Risks & Mitigations, Success Metrics, Rollout Plan
- Use headers and bullet points, not tables

Guidelines:
- Be specific and actionable, not vague
- Use real PM terminology
- When document context is provided, ALWAYS use it to ground your answers — cite specific details from the documents
- Ask clarifying questions when the request is ambiguous
- Keep responses concise but thorough`;

async function getQueryEmbedding(query: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI embeddings error:", response.status, err);
    throw new Error("Failed to generate query embedding");
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from RAG if sessionId provided and OpenAI key available
    let ragContext = "";
    if (sessionId && OPENAI_API_KEY) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get the latest user message for embedding
        const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
        if (lastUserMsg) {
          const queryEmbedding = await getQueryEmbedding(lastUserMsg.content, OPENAI_API_KEY);

          const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
            query_embedding: JSON.stringify(queryEmbedding),
            match_session_id: sessionId,
            match_count: 8,
            match_threshold: 0.25,
          });

          if (error) {
            console.error("RAG search error:", error);
          } else if (chunks && chunks.length > 0) {
            ragContext = chunks
              .map((c: any) => `[From "${c.document_name}" (chunk ${c.chunk_index + 1}, relevance: ${(c.similarity * 100).toFixed(0)}%)]\n${c.content}`)
              .join("\n\n---\n\n");
            console.log(`RAG: Found ${chunks.length} relevant chunks for query`);
          } else {
            console.log("RAG: No relevant chunks found");
          }
        }
      } catch (ragError) {
        console.error("RAG retrieval error (non-fatal):", ragError);
      }
    }

    // Fetch recent negative feedback to improve responses
    let feedbackContext = "";
    if (sessionId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseKey);
        const { data: negFeedback } = await sb
          .from("chat_feedback")
          .select("user_query, message_content")
          .eq("session_id", sessionId)
          .eq("rating", "down")
          .order("created_at", { ascending: false })
          .limit(5);

        if (negFeedback && negFeedback.length > 0) {
          feedbackContext = negFeedback
            .map((f: any) => `- User asked: "${f.user_query?.slice(0, 100) || "N/A"}" → Response was marked unhelpful`)
            .join("\n");
        }
      } catch (e) {
        console.error("Feedback fetch error (non-fatal):", e);
      }
    }

    // Build the messages array with RAG context
    const aiMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];

    if (feedbackContext) {
      aiMessages.push({
        role: "system",
        content: `The user has previously marked these types of responses as unhelpful. Avoid similar patterns:\n${feedbackContext}`,
      });
    }

    if (ragContext) {
      aiMessages.push({
        role: "system",
        content: `The following are relevant excerpts from the user's uploaded product documents. Use these to ground your response:\n\n${ragContext}`,
      });
    }

    aiMessages.push(...messages);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
