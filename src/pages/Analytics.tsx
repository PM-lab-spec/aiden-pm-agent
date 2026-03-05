import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, ArrowLeft, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type FeedbackRow = {
  id: string;
  session_id: string;
  message_content: string;
  user_query: string | null;
  rating: string;
  created_at: string;
};

export default function Analytics() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setFeedback((data as FeedbackRow[]) || []);
      setLoading(false);
    })();
  }, []);

  const ups = feedback.filter((f) => f.rating === "up").length;
  const downs = feedback.filter((f) => f.rating === "down").length;
  const total = ups + downs;
  const upPct = total ? Math.round((ups / total) * 100) : 0;
  const downPct = total ? 100 - upPct : 0;

  // Group by day
  const byDay = feedback.reduce<Record<string, { up: number; down: number }>>((acc, f) => {
    const day = f.created_at.slice(0, 10);
    if (!acc[day]) acc[day] = { up: 0, down: 0 };
    acc[day][f.rating as "up" | "down"]++;
    return acc;
  }, {});
  const days = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14);

  const maxDay = Math.max(...days.map(([, v]) => v.up + v.down), 1);

  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 border-b border-border flex items-center px-4 gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/app")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Feedback Analytics</span>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : total === 0 ? (
          <div className="text-center py-20 space-y-2">
            <p className="text-muted-foreground">No feedback yet.</p>
            <p className="text-xs text-muted-foreground">Users can rate AI responses with 👍 or 👎</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Ratings</p>
                <p className="text-3xl font-bold text-foreground">{total}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Helpful</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{ups} <span className="text-lg text-muted-foreground font-normal">({upPct}%)</span></p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Not Helpful</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{downs} <span className="text-lg text-muted-foreground font-normal">({downPct}%)</span></p>
              </div>
            </div>

            {/* Satisfaction bar */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-sm font-medium text-foreground">Satisfaction Rate</p>
              <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                {upPct > 0 && (
                  <div className="bg-primary transition-all" style={{ width: `${upPct}%` }} />
                )}
                {downPct > 0 && (
                  <div className="bg-destructive transition-all" style={{ width: `${downPct}%` }} />
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>👍 {upPct}% helpful</span>
                <span>👎 {downPct}% not helpful</span>
              </div>
            </div>

            {/* Daily chart */}
            {days.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <p className="text-sm font-medium text-foreground">Daily Feedback (last 14 days)</p>
                <div className="flex items-end gap-1.5 h-32">
                  {days.map(([day, v]) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col-reverse" style={{ height: 100 }}>
                        <div
                          className="bg-primary rounded-t-sm w-full"
                          style={{ height: `${(v.up / maxDay) * 100}%` }}
                        />
                        <div
                          className="bg-destructive rounded-t-sm w-full"
                          style={{ height: `${(v.down / maxDay) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{day.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent negative feedback */}
            {downs > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <p className="text-sm font-medium text-foreground">Recent Negative Feedback</p>
                <div className="space-y-2">
                  {feedback
                    .filter((f) => f.rating === "down")
                    .slice(0, 10)
                    .map((f) => (
                      <div key={f.id} className="border border-border rounded-lg p-3 text-sm">
                        <p className="text-muted-foreground text-xs mb-1">
                          Query: <span className="text-foreground">{f.user_query?.slice(0, 120) || "N/A"}</span>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Response preview: <span className="text-foreground">{f.message_content.slice(0, 150)}...</span>
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
