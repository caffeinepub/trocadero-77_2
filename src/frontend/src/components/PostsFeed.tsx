import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { type Post, getPosts } from "../lib/postsManager";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function PromoCard({ post, index }: { post: Post; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 12 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.1, duration: 0.7, type: "spring" }}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative rounded-2xl overflow-hidden group"
        style={{
          padding: "2px",
          background:
            "linear-gradient(135deg, oklch(72% 0.18 75), oklch(65% 0.22 30), oklch(72% 0.18 75), oklch(75% 0.18 290))",
          backgroundSize: "300% 300%",
          animation: "promo-gradient 4s ease infinite",
        }}
      >
        <div
          className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            background: "oklch(72% 0.18 75)",
            color: "white",
            animation: "promo-pulse 2s ease-in-out infinite",
            boxShadow: "0 0 12px oklch(72% 0.18 75 / 0.8)",
          }}
        >
          🔥 PROMO
        </div>
        <div
          className="relative rounded-[14px] overflow-hidden"
          style={{
            background: "oklch(var(--card))",
            boxShadow:
              "0 0 0 1px rgba(255,200,80,0.3), 0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, transparent 30%, rgba(255,200,80,0.15) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "shimmer-slide 1.5s linear infinite",
            }}
          />
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full object-cover"
              style={{ maxHeight: 240 }}
            />
          )}
          <div className="p-5">
            <p
              className="text-xs font-mono mb-2"
              style={{ color: "oklch(50% 0.08 240)" }}
            >
              {timeAgo(post.createdAt)}
            </p>
            <h3 className="font-display font-bold text-lg leading-tight mb-1 text-foreground">
              {post.title}
            </h3>
            {post.tagline && (
              <p
                className="text-sm font-semibold mb-2"
                style={{ color: "oklch(50% 0.13 60)" }}
              >
                {post.tagline}
              </p>
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

function RegularCard({ post, index }: { post: Post; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
      style={{ perspective: "1000px" }}
    >
      <div
        className="rounded-2xl overflow-hidden"
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
          <p className="text-xs font-mono text-muted-foreground mb-2">
            {timeAgo(post.createdAt)}
          </p>
          <h3 className="font-display font-bold text-lg leading-tight mb-1 text-foreground">
            {post.title}
          </h3>
          {post.tagline && (
            <p className="text-sm font-medium italic mb-2 text-muted-foreground">
              {post.tagline}
            </p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {post.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function PostsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(getPosts());
    const id = setInterval(() => setPosts(getPosts()), 30000);
    return () => clearInterval(id);
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-display font-bold mb-6 text-center">
          Latest Updates
        </h2>
        <div className="space-y-5" data-ocid="posts.list">
          {posts.map((post, i) =>
            post.isPromotional ? (
              <PromoCard key={post.id} post={post} index={i} />
            ) : (
              <RegularCard key={post.id} post={post} index={i} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
