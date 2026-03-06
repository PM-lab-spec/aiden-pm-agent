import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

function generateAgentId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Agent-${result}`;
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [agentId] = useState(() => generateAgentId());
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  const handleDiveIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      // Store agent ID in user metadata
      await supabase.auth.updateUser({ data: { agent_id: agentId } });
      toast.success(`Welcome, ${agentId}!`);
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--gradient-chat-bg)" }}
    >
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white">Aiden</h1>
          <p className="text-sm text-muted-foreground">
            AI Powered Product Manager Assistant
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Your session ID</p>
            <p className="text-lg font-mono font-semibold text-foreground tracking-wider">
              {agentId}
            </p>
          </div>

          <Button
            onClick={handleDiveIn}
            disabled={loading}
            size="lg"
            className="w-full text-base gap-2"
            variant="hero"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            Dive In
          </Button>

          <p className="text-xs text-muted-foreground/60">
            No sign-up required. Your data is tied to this browser session.
          </p>
        </div>
      </div>
    </div>
  );
}
