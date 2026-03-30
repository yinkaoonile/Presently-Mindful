import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Lock, Globe, Trash2, Check, X, Plus, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useGetGoals, 
  useCreateGoal, 
  useUpdateGoal, 
  useDeleteGoal, 
  useGetCommunityGoals, 
  useCheerGoal 
} from "@workspace/api-client-react";

const TABS = [
  { id: "daily", label: "Daily", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-200" },
  { id: "weekly", label: "Weekly", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200" },
  { id: "monthly", label: "Monthly", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-200" },
  { id: "stop", label: "Stop Doing", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-200" },
];

// Mock goals for when API is unavailable
const MOCK_GOALS = [
  { id: 1, title: "Exercise for 30 minutes", type: "daily", isCompleted: false, isPublic: false },
  { id: 2, title: "Read 20 pages", type: "daily", isCompleted: true, isPublic: false },
  { id: 3, title: "Call a friend", type: "weekly", isCompleted: false, isPublic: true },
];

const MOCK_COMMUNITY_GOALS = [
  { id: 1, title: "Meditate daily", type: "daily", typeLabel: "Daily", isCompleted: false, cheers: 5, timeAgo: "2h ago" },
  { id: 2, title: "Drink more water", type: "daily", typeLabel: "Daily", isCompleted: false, cheers: 12, timeAgo: "4h ago" },
];

export default function Goals() {
  const [activeTab, setActiveTab] = useState("daily");
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalIsPublic, setNewGoalIsPublic] = useState(false);

  const queryClient = useQueryClient();
  const { data: goals = [], isLoading: isLoadingGoals, isError: isGoalsError } = useGetGoals();
  const { data: communityGoals = [], isLoading: isLoadingCommunity, isError: isCommunityError } = useGetCommunityGoals();

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const cheerGoal = useCheerGoal();

  const [localCheers, setLocalCheers] = useState<Record<number, boolean>>({});

  const displayGoals = goals.length === 0 && (isGoalsError || isLoadingGoals) ? MOCK_GOALS : goals;
  const displayCommunityGoals = communityGoals.length === 0 && (isCommunityError || isLoadingCommunity) ? MOCK_COMMUNITY_GOALS : communityGoals;

  const activeGoals = displayGoals.filter((g) => g.type === activeTab);
  const incompleteGoals = activeGoals.filter((g) => !g.isCompleted);
  const completedGoals = activeGoals.filter((g) => g.isCompleted);

  const handleAddSubmit = () => {
    if (!newGoalTitle.trim()) return;
    
    createGoal.mutate(
      { 
        data: { 
          title: newGoalTitle.trim(), 
          type: activeTab, 
          isPublic: newGoalIsPublic 
        } 
      },
      {
        onSuccess: () => {
          setNewGoalTitle("");
          setIsAdding(false);
          setNewGoalIsPublic(false);
          queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
        }
      }
    );
  };

  const handleToggleComplete = (goal: any) => {
    updateGoal.mutate(
      { id: goal.id, data: { isCompleted: !goal.isCompleted } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }) }
    );
  };

  const handleTogglePublic = (goal: any) => {
    updateGoal.mutate(
      { id: goal.id, data: { isPublic: !goal.isPublic } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }) }
    );
  };

  const handleDelete = (goalId: number) => {
    deleteGoal.mutate(
      { id: goalId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }) }
    );
  };

  const handleCheer = (goalId: number) => {
    if (localCheers[goalId]) return;
    setLocalCheers(prev => ({ ...prev, [goalId]: true }));
    cheerGoal.mutate(
      { id: goalId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals/community"] }) }
    );
  };

  const currentTabStyle = TABS.find(t => t.id === activeTab);

  return (
    <div className="p-6 pt-12 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">Your Goals</h1>
          <p className="text-sm text-muted-foreground">Small steps lead to big changes.</p>
          {(isGoalsError || isCommunityError) && (
            <p className="text-xs text-accent mt-2">Showing sample goals while connecting...</p>
          )}
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className={cn("w-5 h-5 transition-transform", isAdding && "rotate-45")} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-2xl font-medium transition-all duration-300 text-sm whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-white/60 text-muted-foreground hover:bg-white/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Goal Input */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 rounded-3xl space-y-4">
              <input
                autoFocus
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder={activeTab === 'stop' ? "I want to stop..." : "I want to..."}
                className="w-full bg-white/50 border border-white/50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70 text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit()}
              />
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newGoalIsPublic}
                    onChange={(e) => setNewGoalIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Make public for accountability <Globe className="w-3.5 h-3.5 inline ml-1 opacity-70" /></span>
                </label>
                <button
                  onClick={handleAddSubmit}
                  disabled={!newGoalTitle.trim() || createGoal.isPending}
                  className="px-4 py-2 bg-foreground text-background rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {createGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals List */}
      <div className="space-y-4 min-h-[200px]">
        {isLoadingGoals ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : activeGoals.length === 0 && !isAdding ? (
          <div className="text-center py-12 text-muted-foreground glass-card rounded-3xl">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} goals yet.</p>
            <p className="text-xs opacity-70 mt-1">Tap the + button to add one.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {[...incompleteGoals, ...completedGoals].map((goal) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={goal.id}
                className={cn(
                  "group flex items-center gap-3 p-4 rounded-2xl transition-all",
                  goal.isCompleted ? "bg-white/40 opacity-60" : "glass-card"
                )}
              >
                <button
                  onClick={() => handleToggleComplete(goal)}
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    goal.isCompleted
                      ? (activeTab === 'stop' ? "bg-rose-500 border-rose-500" : "bg-primary border-primary")
                      : "border-muted-foreground/30 hover:border-primary"
                  )}
                >
                  {goal.isCompleted && (
                    activeTab === 'stop' ? <X className="w-3.5 h-3.5 text-white" /> : <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
                
                <span className={cn(
                  "flex-1 text-sm font-medium",
                  goal.isCompleted && "line-through text-muted-foreground"
                )}>
                  {goal.title}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                  <button
                    onClick={() => handleTogglePublic(goal)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-white/50"
                    title={goal.isPublic ? "Make private" : "Make public"}
                  >
                    {goal.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-xl hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Community Section */}
      <div className="mt-12 pt-8 border-t border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-display font-bold text-foreground">Community Goals</h2>
          <Globe className="w-5 h-5 text-primary" />
        </div>

        <div className="space-y-4">
          {isLoadingCommunity ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />)}
            </div>
          ) : displayCommunityGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No public goals yet. Be the first!</p>
            </div>
          ) : (
            displayCommunityGoals.map((cGoal: any) => {
              const typeColor = TABS.find(t => t.id === cGoal.type)?.color || "text-primary";
              const typeBg = TABS.find(t => t.id === cGoal.type)?.bg || "bg-primary/10";
              
              return (
                <div key={cGoal.id} className="glass-card p-4 rounded-2xl">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full", typeBg, typeColor)}>
                          {cGoal.typeLabel || cGoal.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{cGoal.timeAgo}</span>
                      </div>
                      <p className={cn("text-sm font-medium", cGoal.isCompleted && "line-through text-muted-foreground opacity-70")}>
                        "{cGoal.title}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleCheer(cGoal.id)}
                      disabled={localCheers[cGoal.id]}
                      className={cn(
                        "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                        localCheers[cGoal.id]
                          ? "bg-accent/20 text-accent"
                          : "bg-white/50 text-muted-foreground hover:bg-accent/10 hover:text-accent border border-white/50"
                      )}
                    >
                      🎉 {cGoal.cheers + (localCheers[cGoal.id] ? 1 : 0)}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const cheerGoal = useCheerGoal();

  const [localCheers, setLocalCheers] = useState<Record<number, boolean>>({});

  const activeGoals = goals.filter((g) => g.type === activeTab);
  const incompleteGoals = activeGoals.filter((g) => !g.isCompleted);
  const completedGoals = activeGoals.filter((g) => g.isCompleted);

  const handleAddSubmit = () => {
    if (!newGoalTitle.trim()) return;
    
    createGoal.mutate(
      { 
        data: { 
          title: newGoalTitle.trim(), 
          type: activeTab, 
          isPublic: newGoalIsPublic 
        } 
      },
      {
        onSuccess: () => {
          setNewGoalTitle("");
          setIsAdding(false);
          setNewGoalIsPublic(false);
          queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
        }
      }
    );
  };

  const handleToggleComplete = (goal: any) => {
    updateGoal.mutate(
      { id: goal.id, data: { isCompleted: !goal.isCompleted } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }) }
    );
  };

  const handleTogglePublic = (goal: any) => {
    updateGoal.mutate(
      { id: goal.id, data: { isPublic: !goal.isPublic } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }) }
    );
  };

  const handleDelete = (goalId: number) => {
    deleteGoal.mutate(
      { id: goalId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }) }
    );
  };

  const handleCheer = (goalId: number) => {
    if (localCheers[goalId]) return;
    setLocalCheers(prev => ({ ...prev, [goalId]: true }));
    cheerGoal.mutate(
      { id: goalId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals/community"] }) }
    );
  };

  const currentTabStyle = TABS.find(t => t.id === activeTab);

  return (
    <div className="p-6 pt-12 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">Your Goals</h1>
          <p className="text-sm text-muted-foreground">Small steps lead to big changes.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className={cn("w-5 h-5 transition-transform", isAdding && "rotate-45")} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-2xl font-medium transition-all duration-300 text-sm whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-white/60 text-muted-foreground hover:bg-white/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Goal Input */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 rounded-3xl space-y-4">
              <input
                autoFocus
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder={activeTab === 'stop' ? "I want to stop..." : "I want to..."}
                className="w-full bg-white/50 border border-white/50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70 text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit()}
              />
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newGoalIsPublic}
                    onChange={(e) => setNewGoalIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Make public for accountability <Globe className="w-3.5 h-3.5 inline ml-1 opacity-70" /></span>
                </label>
                <button
                  onClick={handleAddSubmit}
                  disabled={!newGoalTitle.trim() || createGoal.isPending}
                  className="px-4 py-2 bg-foreground text-background rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {createGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals List */}
      <div className="space-y-4 min-h-[200px]">
        {isLoadingGoals ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : activeGoals.length === 0 && !isAdding ? (
          <div className="text-center py-12 text-muted-foreground glass-card rounded-3xl">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} goals yet.</p>
            <p className="text-xs opacity-70 mt-1">Tap the + button to add one.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {[...incompleteGoals, ...completedGoals].map((goal) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={goal.id}
                className={cn(
                  "group flex items-center gap-3 p-4 rounded-2xl transition-all",
                  goal.isCompleted ? "bg-white/40 opacity-60" : "glass-card"
                )}
              >
                <button
                  onClick={() => handleToggleComplete(goal)}
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    goal.isCompleted
                      ? (activeTab === 'stop' ? "bg-rose-500 border-rose-500" : "bg-primary border-primary")
                      : "border-muted-foreground/30 hover:border-primary"
                  )}
                >
                  {goal.isCompleted && (
                    activeTab === 'stop' ? <X className="w-3.5 h-3.5 text-white" /> : <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
                
                <span className={cn(
                  "flex-1 text-sm font-medium",
                  goal.isCompleted && "line-through text-muted-foreground"
                )}>
                  {goal.title}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                  <button
                    onClick={() => handleTogglePublic(goal)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-white/50"
                    title={goal.isPublic ? "Make private" : "Make public"}
                  >
                    {goal.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-xl hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Community Section */}
      <div className="mt-12 pt-8 border-t border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-display font-bold text-foreground">Community Goals</h2>
          <Globe className="w-5 h-5 text-primary" />
        </div>

        <div className="space-y-4">
          {isLoadingCommunity ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />)}
            </div>
          ) : communityGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No public goals yet. Be the first!</p>
            </div>
          ) : (
            communityGoals.map((cGoal: any) => {
              const typeColor = TABS.find(t => t.id === cGoal.type)?.color || "text-primary";
              const typeBg = TABS.find(t => t.id === cGoal.type)?.bg || "bg-primary/10";
              
              return (
                <div key={cGoal.id} className="glass-card p-4 rounded-2xl">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full", typeBg, typeColor)}>
                          {cGoal.typeLabel || cGoal.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{cGoal.timeAgo}</span>
                      </div>
                      <p className={cn("text-sm font-medium", cGoal.isCompleted && "line-through text-muted-foreground opacity-70")}>
                        "{cGoal.title}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleCheer(cGoal.id)}
                      disabled={localCheers[cGoal.id]}
                      className={cn(
                        "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                        localCheers[cGoal.id]
                          ? "bg-accent/20 text-accent"
                          : "bg-white/50 text-muted-foreground hover:bg-accent/10 hover:text-accent border border-white/50"
                      )}
                    >
                      🎉 {cGoal.cheers + (localCheers[cGoal.id] ? 1 : 0)}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
