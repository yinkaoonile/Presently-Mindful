import { useState } from "react";
import { useGetCommunityFeed, useSendHug, useSendLike, getGetCommunityFeedQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Community() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetCommunityFeed({ page: 1, limit: 20 });
  const sendHug = useSendHug();
  const sendLike = useSendLike();

  const [localInteractions, setLocalInteractions] = useState<Record<number, { liked?: boolean, hugged?: boolean }>>({});

  const handleHug = (id: number) => {
    if (localInteractions[id]?.hugged) return;
    
    // Optimistic update locally for UI speed
    setLocalInteractions(prev => ({ ...prev, [id]: { ...prev[id], hugged: true } }));
    
    sendHug.mutate({ id }, {
      onSuccess: () => {
        // Soft invalidation to catch up
        queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      }
    });
  };

  const handleLike = (id: number) => {
    if (localInteractions[id]?.liked) return;
    
    setLocalInteractions(prev => ({ ...prev, [id]: { ...prev[id], liked: true } }));
    
    sendLike.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 pt-12 space-y-6">
        <div className="h-10 w-48 bg-muted rounded-xl animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 w-full glass-card rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Community</h1>
        <p className="text-muted-foreground">You are not alone. See how others are feeling today anonymously.</p>
      </div>

      <div className="flex flex-col gap-6">
        <AnimatePresence>
          {data?.posts.map((post, i) => {
            const hasLiked = localInteractions[post.id]?.liked;
            const hasHugged = localInteractions[post.id]?.hugged;
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 rounded-3xl relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl shadow-sm">
                      {post.moodEmoji}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Anonymous</div>
                      <div className="text-xs text-muted-foreground">{post.timeAgo}</div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-foreground/90 font-medium leading-relaxed mb-6">
                  "{post.snippet}"
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                  <button
                    onClick={() => handleHug(post.id)}
                    disabled={hasHugged}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all",
                      hasHugged 
                        ? "bg-accent/20 text-accent" 
                        : "bg-secondary text-secondary-foreground hover:bg-accent/10 hover:text-accent"
                    )}
                  >
                    <motion.div
                      animate={hasHugged ? { scale: [1, 1.5, 1] } : {}}
                    >
                      💛
                    </motion.div>
                    {post.hugs + (hasHugged ? 1 : 0)} Hugs
                  </button>

                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={hasLiked}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all",
                      hasLiked 
                        ? "bg-primary/20 text-primary" 
                        : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", hasLiked && "fill-current text-primary")} />
                    {post.likes + (hasLiked ? 1 : 0)}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {data?.posts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>It's quiet here today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
