import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { useCreateCheckin } from "@workspace/api-client-react";
import { useCheckinFlow } from "@/context/CheckinContext";
import { cn } from "@/lib/utils";

const MOODS = [
  { value: 1, emoji: "😔", label: "Struggling" },
  { value: 2, emoji: "😕", label: "Off" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { setLatestCheckin } = useCheckinFlow();
  
  const [mood, setMood] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [shareAnonymously, setShareAnonymously] = useState(false);

  const createCheckin = useCreateCheckin();

  const handleSubmit = () => {
    if (!mood) return;

    createCheckin.mutate(
      {
        data: {
          mood,
          journal: journal.trim() || null,
          shareAnonymously,
        }
      },
      {
        onSuccess: (data) => {
          setLatestCheckin(data);
          setLocation("/share");
        }
      }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 pt-12 flex flex-col min-h-[calc(100vh-5rem)]"
    >
      <div className="text-center mb-10">
        <span className="text-sm font-semibold tracking-wider text-primary uppercase mb-2 block">
          Daily Check-in
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
          How are you feeling today?
        </h1>
      </div>

      {/* Mood Selector */}
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-white mb-8">
        {MOODS.map((m) => {
          const isSelected = mood === m.value;
          return (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className="relative group flex flex-col items-center gap-2 p-2 outline-none"
            >
              <motion.div
                animate={{ 
                  scale: isSelected ? 1.4 : 1,
                  y: isSelected ? -8 : 0,
                  filter: isSelected ? 'grayscale(0%)' : 'grayscale(40%)'
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                className="text-4xl sm:text-5xl drop-shadow-sm transition-all duration-200"
              >
                {m.emoji}
              </motion.div>
              
              <span className={cn(
                "text-[11px] font-medium transition-all duration-300 absolute -bottom-4",
                isSelected ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-50"
              )}>
                {m.label}
              </span>

              {isSelected && (
                <motion.div 
                  layoutId="mood-indicator"
                  className="absolute -bottom-6 w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Journal Entry */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative flex-1 min-h-[200px]">
          <textarea
            value={journal}
            onChange={(e) => setJournal(e.e.target.value)}
            placeholder="What's on your mind? (Optional)"
            className="w-full h-full p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white resize-none transition-all duration-300 text-foreground placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Toggle */}
        <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 cursor-pointer hover:bg-white/60 transition-colors border border-transparent hover:border-white">
          <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300" style={{ backgroundColor: shareAnonymously ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.3)' }}>
            <input
              type="checkbox"
              className="peer sr-only"
              checked={shareAnonymously}
              onChange={(e) => setShareAnonymously(e.target.checked)}
            />
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition duration-300",
                shareAnonymously ? "translate-x-6" : "translate-x-1"
              )}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Share anonymously</span>
            <span className="text-xs text-muted-foreground">Let the community send you hugs</span>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        disabled={!mood || createCheckin.isPending}
        onClick={handleSubmit}
        className={cn(
          "mt-8 w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 text-lg transition-all duration-300",
          !mood 
            ? "bg-muted text-muted-foreground cursor-not-allowed" 
            : "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0"
        )}
      >
        {createCheckin.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Reflecting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Complete Check-in
          </>
        )}
      </button>
    </motion.div>
  );
}
