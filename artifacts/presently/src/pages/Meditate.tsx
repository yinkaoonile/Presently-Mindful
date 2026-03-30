import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useLogMeditationSession } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Loader2, ArrowLeft, Heart } from "lucide-react";

const DURATIONS = [
  { label: "3 min", value: 180, type: "short" },
  { label: "5 min", value: 300, type: "medium" },
  { label: "10 min", value: 600, type: "long" },
];

const TYPES = [
  { id: "breathing", icon: "🌬️", label: "Breathing" },
  { id: "body_scan", icon: "🫀", label: "Body Scan" },
  { id: "visualization", icon: "🌈", label: "Visualization" },
  { id: "gratitude", icon: "🙏", label: "Gratitude" },
];

export default function Meditate() {
  const [, setLocation] = useLocation();
  const [durationSecs, setDurationSecs] = useState(180);
  const [type, setType] = useState("breathing");
  
  const [isMeditating, setIsMeditating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [notes, setNotes] = useState("");

  const [phase, setPhase] = useState("Breathe in...");

  const logSession = useLogMeditationSession();

  // Breathing cycle
  useEffect(() => {
    if (!isMeditating) return;
    
    let cycle = 0;
    const interval = setInterval(() => {
      cycle = (cycle + 1) % 3;
      if (cycle === 0) setPhase("Breathe in...");
      else if (cycle === 1) setPhase("Hold...");
      else setPhase("Breathe out...");
    }, 4000); // 4s inhale, 4s hold, 4s exhale
    
    return () => clearInterval(interval);
  }, [isMeditating]);

  // Timer
  useEffect(() => {
    if (!isMeditating) return;
    
    if (timeLeft <= 0) {
      setIsMeditating(false);
      setIsCompleted(true);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isMeditating, timeLeft]);

  const handleStart = () => {
    setTimeLeft(durationSecs);
    setIsMeditating(true);
    setPhase("Breathe in...");
  };

  const handleEndEarly = () => {
    setIsMeditating(false);
    setIsCompleted(true);
  };

  const handleSave = () => {
    const selectedDuration = DURATIONS.find(d => d.value === durationSecs);
    logSession.mutate({
      data: {
        durationSeconds: durationSecs - timeLeft,
        durationType: selectedDuration?.type || "short",
        meditationType: type,
        notes: notes.trim() || null,
      }
    }, {
      onSuccess: () => {
        setLocation("/");
      },
      onError: (error: any) => {
        // Show error but still allow navigation
        console.log("[v0] Meditation log error:", error);
        // Still navigate back to home
        setTimeout(() => setLocation("/"), 500);
      }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isCompleted) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 pt-12 flex flex-col min-h-[calc(100vh-5rem)] justify-center max-w-md mx-auto"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl"
          >
            🎉
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Session complete!
          </h1>
          <p className="text-muted-foreground">
            You meditated for {formatTime(durationSecs - Math.max(0, timeLeft))}.
          </p>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-semibold text-foreground mb-2">
            How are you feeling now?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any reflections..."
            className="w-full h-40 p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 resize-none transition-all"
          />
        </div>

        <button
          disabled={logSession.isPending}
          onClick={handleSave}
          className="mt-8 w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 text-lg bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          {logSession.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
          Save & close
        </button>
      </motion.div>
    );
  }

  if (isMeditating) {
    return (
      <div className="p-6 flex flex-col h-screen justify-between max-w-md mx-auto relative overflow-hidden bg-background">
        <div className="text-center pt-12 relative z-10">
          <p className="text-xl font-display font-medium text-foreground/80">{formatTime(timeLeft)}</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <motion.div
            animate={{
              scale: phase === "Breathe in..." ? 1.5 : phase === "Hold..." ? 1.5 : 1,
              opacity: phase === "Hold..." ? 0.8 : 1
            }}
            transition={{
              duration: 4,
              ease: "easeInOut"
            }}
            className="w-48 h-48 rounded-full bg-gradient-to-tr from-primary/40 to-accent/40 blur-xl absolute"
          />
          <motion.div
            animate={{
              scale: phase === "Breathe in..." ? 1.4 : phase === "Hold..." ? 1.4 : 1,
            }}
            transition={{
              duration: 4,
              ease: "easeInOut"
            }}
            className="w-40 h-40 rounded-full bg-primary/20 backdrop-blur-sm border border-white/40 flex items-center justify-center relative shadow-lg shadow-primary/10"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={phase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-lg font-medium text-foreground absolute"
              >
                {phase}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="pb-12 relative z-10 flex justify-center">
          <button
            onClick={handleEndEarly}
            className="px-6 py-3 rounded-full border border-border bg-white/50 backdrop-blur-sm text-muted-foreground font-medium hover:bg-white/80 transition-colors"
          >
            End Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 pt-12 flex flex-col min-h-[calc(100vh-5rem)] max-w-md mx-auto pb-32"
    >
      <div className="flex items-center mb-8 gap-4">
        <button onClick={() => setLocation("/")} className="p-2 rounded-full hover:bg-white/50 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Meditation Space
        </h1>
      </div>

      <div className="space-y-8 flex-1">
        {/* Duration */}
        <div className="space-y-4">
          <label className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Duration</label>
          <div className="flex gap-3">
            {DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => setDurationSecs(d.value)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-2xl font-medium transition-all duration-300",
                  durationSecs === d.value
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-white/60 text-muted-foreground hover:bg-white/80"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="space-y-4">
          <label className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Focus</label>
          <div className="grid grid-cols-2 gap-4">
            {TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all duration-300",
                  type === t.id
                    ? "bg-white border-primary shadow-sm ring-1 ring-primary/20"
                    : "bg-white/40 border-transparent hover:bg-white/60"
                )}
              >
                <span className="text-3xl">{t.icon}</span>
                <span className={cn(
                  "font-medium text-sm",
                  type === t.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="mt-8 w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 text-lg bg-foreground text-background shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
      >
        Begin
      </button>
    </motion.div>
  );
}
