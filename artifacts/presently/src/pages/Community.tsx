import { useState } from "react";
import { 
  useGetCommunityFeed, 
  useSendHug, 
  useSendLike, 
  useCheckOnPost, 
  useGetCommunityReplies, 
  useAddCommunityReply 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, MessageCircle, HeartHandshake, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock community posts for when API is unavailable
const MOCK_POSTS = [
  {
    id: 1,
    moodEmoji: "😊",
    snippet: "Had a great day today! Feeling more positive than usual.",
    hugs: 12,
    likes: 8,
    checkOns: 3,
    replyCount: 2,
    timeAgo: "2h ago"
  },
  {
    id: 2,
    moodEmoji: "😐",
    snippet: "Work has been challenging, but I'm taking it one step at a time.",
    hugs: 24,
    likes: 15,
    checkOns: 5,
    replyCount: 4,
    timeAgo: "4h ago"
  },
  {
    id: 3,
    moodEmoji: "🙂",
    snippet: "Tried meditation for the first time and it really helped me relax.",
    hugs: 18,
    likes: 22,
    checkOns: 2,
    replyCount: 3,
    timeAgo: "6h ago"
  }
];

// Extracted Post Component to handle per-post state (replies)
function PostCard({ post, localInteractions, onHug, onLike, onCheckOn }: any) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  
  const hasLiked = localInteractions[post.id]?.liked;
  const hasHugged = localInteractions[post.id]?.hugged;
  const hasCheckedOn = localInteractions[post.id]?.checkedOn;
  
  const { data: repliesData, isLoading: repliesLoading } = useGetCommunityReplies(post.id, {
    query: { enabled: showReplies }
  });
  
  const addReply = useAddCommunityReply();
  const queryClient = useQueryClient();

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    
    addReply.mutate(
      { id: post.id, data: { message: replyText.trim() } },
      {
        onSuccess: () => {
          setReplyText("");
          queryClient.invalidateQueries({ queryKey: [`/api/community/${post.id}/replies`] });
          queryClient.invalidateQueries({ queryKey: ["/api/community"] });
        }
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
      <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
        <button
          onClick={() => onHug(post.id)}
          disabled={hasHugged}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-xs transition-all",
            hasHugged 
              ? "bg-accent/20 text-accent" 
              : "bg-secondary text-secondary-foreground hover:bg-accent/10 hover:text-accent"
          )}
        >
          <motion.div animate={hasHugged ? { scale: [1, 1.5, 1] } : {}}>
            💛
          </motion.div>
          {post.hugs + (hasHugged ? 1 : 0)}
        </button>

        <button
          onClick={() => onLike(post.id)}
          disabled={hasLiked}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-xs transition-all",
            hasLiked 
              ? "bg-primary/20 text-primary" 
              : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", hasLiked && "fill-current text-primary")} />
          {post.likes + (hasLiked ? 1 : 0)}
        </button>

        <button
          onClick={() => onCheckOn(post.id)}
          disabled={hasCheckedOn}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-xs transition-all",
            hasCheckedOn 
              ? "bg-blue-500/20 text-blue-500" 
              : "bg-secondary text-secondary-foreground hover:bg-blue-500/10 hover:text-blue-500"
          )}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Check on them {post.checkOns + (hasCheckedOn ? 1 : 0) > 0 ? `(${post.checkOns + (hasCheckedOn ? 1 : 0)})` : ""}
        </button>

        <button
          onClick={() => setShowReplies(!showReplies)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-xs transition-all bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary ml-auto"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {post.replyCount || 0} Replies
        </button>
      </div>

      {/* Replies Panel */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-border/50 space-y-4">
              {repliesLoading ? (
                <div className="text-center py-2 text-xs text-muted-foreground">Loading replies...</div>
              ) : repliesData?.length === 0 ? (
                <div className="text-center py-2 text-xs text-muted-foreground">No replies yet. Be the first to share support!</div>
              ) : (
                <div className="space-y-3">
                  {repliesData?.map((reply: any) => (
                    <div key={reply.id} className="bg-secondary/50 rounded-2xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold">Anonymous</span>
                        <span className="text-[10px] text-muted-foreground">{reply.timeAgo}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Share what helped you..."
                  className="w-full text-sm p-3 pr-12 bg-white/60 rounded-2xl border border-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/70"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReplySubmit();
                  }}
                />
                <button 
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || addReply.isPending}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-primary text-white disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Community() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useGetCommunityFeed({ page: 1, limit: 20 });
  const sendHug = useSendHug();
  const sendLike = useSendLike();
  const checkOnPost = useCheckOnPost();

  const [localInteractions, setLocalInteractions] = useState<Record<number, { liked?: boolean, hugged?: boolean, checkedOn?: boolean }>>({});

  const handleHug = (id: number) => {
    if (localInteractions[id]?.hugged) return;
    setLocalInteractions(prev => ({ ...prev, [id]: { ...prev[id], hugged: true } }));
    sendHug.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/community"] }) });
  };

  const handleLike = (id: number) => {
    if (localInteractions[id]?.liked) return;
    setLocalInteractions(prev => ({ ...prev, [id]: { ...prev[id], liked: true } }));
    sendLike.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/community"] }) });
  };

  const handleCheckOn = (id: number) => {
    if (localInteractions[id]?.checkedOn) return;
    setLocalInteractions(prev => ({ ...prev, [id]: { ...prev[id], checkedOn: true } }));
    checkOnPost.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/community"] }) });
  };

  // Use mock data if loading or error
  const posts = data?.posts || (isLoading || isError ? MOCK_POSTS : []);
  const displayPosts = isLoading || isError ? MOCK_POSTS : posts;

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
        {isError && (
          <p className="text-xs text-accent mt-2">Showing sample posts while connecting...</p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <AnimatePresence>
          {displayPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <PostCard 
                post={post} 
                localInteractions={localInteractions} 
                onHug={handleHug} 
                onLike={handleLike} 
                onCheckOn={handleCheckOn} 
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {displayPosts.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>It's quiet here today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
