import { forwardRef, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface MessageFeedbackProps {
  sessionId?: string;
  messageContent: string;
  userQuery?: string;
}

const MessageFeedback = forwardRef<HTMLDivElement, MessageFeedbackProps>(function MessageFeedback(
  { sessionId, messageContent, userQuery },
  ref,
) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleFeedback = async (value: "up" | "down") => {
    if (rating || submitting) return;
    setSubmitting(true);
    setRating(value);

    try {
      const { error } = await supabase.from("chat_feedback").insert({
        session_id: sessionId || "unknown",
        message_content: messageContent.slice(0, 2000),
        user_query: userQuery?.slice(0, 1000) || null,
        rating: value,
        user_id: user?.id,
      });

      if (error) {
        console.error("Feedback error:", error);
        setRating(null);
        toast.error("Failed to save feedback");
      }
    } catch (error) {
      console.error("Feedback request failed:", error);
      setRating(null);
      toast.error("Failed to save feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={ref} className="flex items-center gap-1 mt-2">
      <button
        onClick={() => handleFeedback("up")}
        disabled={!!rating}
        className={`p-1.5 rounded-md transition-colors ${
          rating === "up"
            ? "text-primary bg-primary/10"
            : rating
            ? "text-muted-foreground/30 cursor-default"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        title="Helpful"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => handleFeedback("down")}
        disabled={!!rating}
        className={`p-1.5 rounded-md transition-colors ${
          rating === "down"
            ? "text-destructive bg-destructive/10"
            : rating
            ? "text-muted-foreground/30 cursor-default"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        title="Not helpful"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      {rating && (
        <span className="text-xs text-muted-foreground ml-1">Thanks!</span>
      )}
    </div>
  );
});

export default MessageFeedback;
