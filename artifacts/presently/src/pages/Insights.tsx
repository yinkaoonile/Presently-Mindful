import { useGetStreak, useGetMeditationStreak } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Flame, Lock, Calendar, TrendingUp, HeartPulse } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

export default function Insights() {
  const { data: stats, isLoading: isStatsLoading } = useGetStreak();
  const { data: medStats, isLoading: isMedStatsLoading } = useGetMeditationStreak();

  const isLoading = isStatsLoading || isMedStatsLoading;

  if (isLoading || !stats || !medStats) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
          <div className="w-32 h-4 rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 flex flex-col gap-8 pb-32">
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold text-foreground">Your Journey</h1>
      </div>

      {/* Mood Streak Hero */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 rounded-3xl text-center relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Flame className="w-32 h-32" />
        </div>
        
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 text-orange-500 mb-4 shadow-inner">
          <Flame className="w-10 h-10" fill="currentColor" />
        </div>
        <h2 className="text-5xl font-display font-bold text-foreground mb-2">
          {stats.currentStreak} <span className="text-2xl text-muted-foreground font-medium">days</span>
        </h2>
        <p className="text-muted-foreground font-medium">You're on a roll! Keep it up.</p>
        
        <div className="mt-8 pt-6 border-t border-border/50 flex justify-between px-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Longest</p>
            <p className="font-bold text-lg">{stats.longestStreak}</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="font-bold text-lg">{stats.totalCheckins}</p>
          </div>
        </div>
      </motion.div>

      {/* Meditation Streak */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6 rounded-3xl bg-gradient-to-br from-white/80 to-primary/5"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
              <HeartPulse className="w-5 h-5 text-primary" />
              Meditation Practice
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {medStats.totalMinutes} mindful minutes total
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary flex items-center justify-end gap-1">
              <Flame className="w-5 h-5 fill-primary text-primary" />
              {medStats.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Day Streak</p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white/50 rounded-2xl p-4 shadow-inner">
          {medStats.weeklyActivity.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                day.didMeditate 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-white text-muted-foreground border border-border"
              )}>
                {day.didMeditate ? "🧘" : ""}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {day.dayLabel}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 rounded-3xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Weekly Mood
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Average: {stats.averageMood.toFixed(1)} / 5</p>
          </div>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weeklyMoods} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="dayLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="mood" radius={[6, 6, 6, 6]} maxBarSize={40}>
                {stats.weeklyMoods.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.mood ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} 
                    fillOpacity={entry.mood ? 0.8 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Pro Teaser */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative rounded-3xl overflow-hidden shadow-xl"
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/pro-bg.png`}
          alt="Premium background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        
        <div className="relative z-10 p-8 text-white flex flex-col items-start h-full justify-end">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-2">Unlock Presently Pro</h3>
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            Get 30-day deep trend analysis, therapist matching, and guided mindfulness programs.
          </p>
          <button className="w-full py-3.5 bg-white text-black rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform active:scale-95">
            Upgrade for $9/mo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
