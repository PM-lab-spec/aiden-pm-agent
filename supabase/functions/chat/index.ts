import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

When generating artifacts, always use these structured formats:

**PRD Format:**
- Problem Statement
- User Persona
- Goals & Non-goals
- Feature Description
- User Journey
- Requirements (functional & non-functional)
- Risks & Mitigations
- Success Metrics
- Rollout Plan

**User Stories Format:**
- Epic name and description
- Stories with "As a [persona], I want [action], so that [outcome]"
- Acceptance Criteria for each story

**Roadmap Format:**
- Now (current sprint/quarter)
- Next (upcoming)
- Later (future)
- Dependencies & Assumptions

**Metrics/Experiment Plan Format:**
- Hypothesis
- Primary & Secondary KPIs
- Experiment Design
- Sample Size & Duration
- Success Criteria

Guidelines:
- Be specific and actionable, not vague
- Use real PM terminology
- Structure outputs with clear markdown formatting
- When the user references uploaded documents, incorporate that context
- Ask clarifying questions when the request is ambiguous
- Keep responses concise but thorough`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
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
