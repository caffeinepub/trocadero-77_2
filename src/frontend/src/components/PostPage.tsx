import { FileText } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { type Post, getPosts } from "../lib/postsManager";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PromoPost({ post, index }: { post: Post; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative rounded-2xl overflow-hidden group"
        style={{
          padding: "2px",
          background:
            "linear-gradient(135deg, #f59e0b, #ef4444, #f59e0b, #a855f7)",
          backgroundSize: "300% 300%",
          animation: "promo-gradient 4s ease infinite",
          boxShadow: "0 8px 32px rgba(245,158,11,0.3)",
        }}
      >
        <div
          className="absolute top-4 right-4 z-10 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{
            background: "rgba(245,158,11,0.9)",
            animation: "promo-pulse 2s ease-in-out infinite",
            boxShadow: "0 0 12px rgba(245,158,11,0.8)",
          }}
        >
          🔥 PROMO
        </div>
        <div
          className="rounded-[14px] overflow-hidden"
          style={{ background: "oklch(var(--card))" }}
        >
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full object-cover"
              style={{ maxHeight: 260 }}
            />
          )}
          <div className="p-5">
            <div className="text-xs font-mono text-amber-600 dark:text-amber-400 mb-1">
              {timeAgo(post.createdAt)}
            </div>
            <h3 className="font-display font-bold text-xl mb-1 text-foreground">
              {post.title}
            </h3>
            {"tagline" in post &&
              (post as Post & { tagline?: string }).tagline && (
                <div className="text-sm text-amber-600 dark:text-amber-400 font-semibold mb-2">
                  {(post as Post & { tagline?: string }).tagline}
                </div>
              )}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {post.content}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RegularPost({ post, index }: { post: Post; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
      style={{ perspective: "1000px" }}
    >
      <div
        className="rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full object-cover"
            style={{ maxHeight: 220 }}
          />
        )}
        <div className="p-5">
          <div className="text-xs font-mono text-muted-foreground mb-2">
            {timeAgo(post.createdAt)}
          </div>
          <h3 className="font-display font-bold text-xl mb-1 text-foreground">
            {post.title}
          </h3>
          {"tagline" in post &&
            (post as Post & { tagline?: string }).tagline && (
              <div className="text-sm text-muted-foreground font-medium italic mb-2">
                {(post as Post & { tagline?: string }).tagline}
              </div>
            )}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {post.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function PostPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(getPosts());
    const id = setInterval(() => setPosts(getPosts()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold mb-2">
            Posts &amp; Updates
          </h1>
          <p className="text-muted-foreground">
            Latest announcements from Trocadero 77
          </p>
        </div>

        {posts.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: "oklch(var(--muted))",
              border: "1px solid oklch(var(--border))",
            }}
            data-ocid="posts.empty_state"
          >
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <div className="text-muted-foreground">
              No posts yet. Check back soon!
            </div>
          </div>
        ) : (
          <div className="space-y-6" data-ocid="posts.list">
            {posts.map((post, i) =>
              post.isPromotional ? (
                <PromoPost key={post.id} post={post} index={i} />
              ) : (
                <RegularPost key={post.id} post={post} index={i} />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
