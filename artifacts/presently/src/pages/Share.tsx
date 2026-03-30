import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Copy, Share2, ArrowRight, Sparkles, Quote } from "lucide-react";
import { useCheckinFlow } from "@/context/CheckinContext";

export default function Share() {
  const [, setLocation] = useLocation();
  const { latestCheckin } = useCheckinFlow();

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!latestCheckin) {
      setLocation("/");
    }
  }, [latestCheckin, setLocation]);

  if (!latestCheckin) return null;

  const { reflection, quoteCard } = latestCheckin;

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${quoteCard.quote}" - Presently`);
    // Ideally trigger a toast here
  };

  return (
    <div className="min-h-screen relative flex flex-col p-6 pt-12">
      {/* Decorative background image loaded from requirements */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/calm-bg.png`} 
          alt="" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image if it fails to load
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
          }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            AI Reflection
          </div>
          <p className="text-lg leading-relaxed text-foreground/80 font-medium">
            {reflection}
          </p>
        </motion.div>

        {/* Quote Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/20 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white p-8 flex flex-col justify-center items-center text-center mt-auto mb-8 group"
        >
          <Quote className="w-12 h-12 text-primary/20 absolute top-8 left-8" />
          <h2 className="text-3xl font-display font-bold text-foreground leading-snug mb-6 relative z-10">
            "{quoteCard.quote}"
          </h2>
          <div className="absolute bottom-8 flex items-center gap-3 text-muted-foreground font-medium text-sm">
            <span>Presently</span>
            <span className="w-1 h-1 rounded-full bg-primary/40" />
            <span>{new Date(quoteCard.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <button 
            onClick={handleCopy}
            className="py-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white hover:bg-white flex items-center justify-center gap-2 text-foreground font-semibold shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <Copy className="w-4 h-4" />
            Copy Quote
          </button>
          <button 
            className="py-3.5 rounded-2xl bg-[#000000] text-white flex items-center justify-center gap-2 font-semibold shadow-sm hover:shadow-lg transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Share to X
          </button>
        </motion.div>

        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => setLocation("/insights")}
          className="w-full py-4 rounded-2xl text-muted-foreground hover:text-foreground font-semibold flex items-center justify-center gap-2 transition-colors group"
        >
          Continue to Insights
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </div>
  );
}
