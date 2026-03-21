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

function PromoCard({ post }: { post: Post }) {
  return (
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
      {/* Pulsing promo badge */}
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
          background: "linear-gradient(135deg, #fffbf0, #fff8e8)",
          boxShadow:
            "0 0 0 1px rgba(255,200,80,0.3), 0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        {/* Shimmer overlay on hover */}
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
          <h3
            className="font-display font-bold text-lg leading-tight mb-2"
            style={{ color: "oklch(25% 0.02 60)" }}
          >
            {post.title}
          </h3>
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: "oklch(40% 0.02 60)" }}
          >
            {post.content}
          </p>
          <p
            className="text-xs font-mono"
            style={{ color: "oklch(60% 0.05 60)" }}
          >
            {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RegularCard({ post }: { post: Post }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
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
        <h3 className="font-display font-bold text-lg leading-tight mb-2 text-foreground">
          {post.title}
        </h3>
        <p className="text-sm leading-relaxed mb-3 text-foreground/70">
          {post.content}
        </p>
        <p className="text-xs font-mono text-foreground/40">
          {timeAgo(post.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function PostsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(getPosts());
    // Poll for new posts every 5 seconds (in case admin adds from another tab)
    const id = setInterval(() => setPosts(getPosts()), 5000);
    return () => clearInterval(id);
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xl">📢</span>
        <h2 className="font-display font-bold text-xl text-foreground">
          Latest Updates
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-5">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            {post.isPromotional ? (
              <PromoCard post={post} />
            ) : (
              <RegularCard post={post} />
            )}
          </motion.div>
        ))}
      </div>

      <style>{`
        @keyframes promo-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes promo-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 12px oklch(72% 0.18 75 / 0.8); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px oklch(72% 0.18 75 / 1); }
        }
        @keyframes shimmer-slide {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </section>
  );
}
