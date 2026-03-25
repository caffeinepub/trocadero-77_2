import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Edit2,
  Eye,
  EyeOff,
  FileImage,
  Loader2,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ManagedUser,
  createUser,
  deleteUser,
  getAllUsers,
  updateUser,
} from "../lib/authManager";
import { type Post, deletePost, getPosts, savePost } from "../lib/postsManager";
import AIDashboardPage from "./AIDashboardPage";

type Duration = "1" | "7" | "30" | "365" | "never";

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: "1", label: "1 Day" },
  { value: "7", label: "1 Week" },
  { value: "30", label: "1 Month" },
  { value: "365", label: "1 Year" },
  { value: "never", label: "Never Expires" },
];

function getDays(d: Duration): number | null {
  if (d === "never") return null;
  return Number.parseInt(d, 10);
}

function getUserStatus(user: ManagedUser): "active" | "expired" | "permanent" {
  if (user.expiresAt === 0) return "permanent";
  if (Date.now() > user.expiresAt) return "expired";
  return "active";
}

function fmtDate(ts: number): string {
  if (ts === 0) return "Never";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function generateUID(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return `T77-${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
}

function getOrCreateUID(username: string): string {
  const key = `t77_uid_${username}`;
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = generateUID();
    localStorage.setItem(key, uid);
  }
  return uid;
}

interface FormData {
  username: string;
  password: string;
  duration: Duration;
}

const EMPTY_FORM: FormData = { username: "", password: "", duration: "365" };

// ─── Bento Stat Card ───────────────────────────────────────────────────────
function BentoCard({
  label,
  value,
  icon,
  color,
  onClick,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  subtitle?: string;
}) {
  const [displayed, setDisplayed] = useState(0);
  const isNum = typeof value === "number";

  useEffect(() => {
    if (!isNum) return;
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplayed(Math.round(eased * (value as number)));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, isNum]);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative rounded-2xl p-5 text-left overflow-hidden cursor-pointer transition-all"
      style={{
        background: "oklch(var(--card))",
        border: `1px solid ${color}40`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
      data-ocid={`admin.${label.toLowerCase().replace(/\s/g, "_")}.card`}
    >
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        }}
      />
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-3xl font-display font-bold" style={{ color }}>
        {isNum ? displayed : value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
    </motion.button>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────
function UsersTab({
  adminUsername: _adminUsername,
}: { adminUsername: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const reload = useCallback(() => setUsers(getAllUsers()), []);
  useEffect(() => {
    reload();
  }, [reload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.username.trim() || !form.password.trim()) {
      setFormError("Username and password are required.");
      return;
    }
    setSaving(true);
    try {
      const days = getDays(form.duration);
      if (editingUser) {
        const result = updateUser(editingUser, {
          password: form.password,
          durationDays: days,
        });
        if (!result.success) {
          setFormError(result.error ?? "Update failed");
          return;
        }
      } else {
        const result = createUser(form.username, form.password, days);
        if (!result.success) {
          setFormError(result.error ?? "Create failed");
          return;
        }
        // Ensure UID is generated
        getOrCreateUID(form.username);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingUser(null);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u: ManagedUser) => {
    setEditingUser(u.username);
    const days =
      u.expiresAt === 0
        ? "never"
        : (String(
            Math.round((u.expiresAt - Date.now()) / 86400000),
          ) as Duration);
    setForm({
      username: u.username,
      password: u.password,
      duration: DURATION_OPTIONS.find(
        (o) =>
          getDays(o.value) !== null &&
          getDays(o.value) ===
            Math.round((u.expiresAt - Date.now()) / 86400000),
      )
        ? days
        : "never",
    });
    setShowForm(true);
  };

  const handleDelete = (username: string) => {
    deleteUser(username);
    setDeleteTarget(null);
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg">
          Users ({users.length})
        </h3>
        <Button
          size="sm"
          onClick={() => {
            setShowForm(true);
            setEditingUser(null);
            setForm(EMPTY_FORM);
          }}
          className="gap-2"
          data-ocid="admin.users.open_modal_button"
        >
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="rounded-2xl p-5 mb-5"
            style={{
              background: "oklch(var(--muted))",
              border: "1px solid oklch(var(--border))",
            }}
            data-ocid="admin.users.modal"
          >
            <h4 className="font-semibold text-sm mb-4">
              {editingUser ? "Edit User" : "New User"}
            </h4>
            {formError && (
              <div
                className="mb-3 text-xs text-red-600 dark:text-red-400 px-3 py-2 rounded-lg"
                style={{ background: "oklch(60% 0.22 25 / 0.1)" }}
              >
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Username
                </Label>
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  disabled={!!editingUser}
                  placeholder="username"
                  className="mt-1"
                  data-ocid="admin.users.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="password"
                    className="pr-10"
                    data-ocid="admin.users.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Subscription Duration
              </Label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, duration: opt.value }))
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background:
                        form.duration === opt.value
                          ? "oklch(62% 0.18 145)"
                          : "oklch(var(--secondary))",
                      color:
                        form.duration === opt.value
                          ? "white"
                          : "oklch(var(--foreground))",
                      border: `1px solid ${form.duration === opt.value ? "oklch(62% 0.18 145)" : "oklch(var(--border))"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="gap-2"
                data-ocid="admin.users.submit_button"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingUser ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setForm(EMPTY_FORM);
                }}
                data-ocid="admin.users.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Users list */}
      <div className="space-y-3" data-ocid="admin.users.list">
        {users.map((u, i) => {
          const status = getUserStatus(u);
          const uid = getOrCreateUID(u.username);
          return (
            <motion.div
              key={u.username}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
              }}
              data-ocid={`admin.users.item.${i + 1}`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{
                  background:
                    status === "active"
                      ? "oklch(62% 0.18 145)"
                      : status === "expired"
                        ? "oklch(60% 0.22 25)"
                        : "oklch(65% 0.12 220)",
                }}
              >
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">
                  {u.username}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {uid}
                </div>
                <div className="text-xs text-muted-foreground">
                  Expires: {fmtDate(u.expiresAt)}
                </div>
              </div>
              <Badge
                variant={
                  status === "active"
                    ? "secondary"
                    : status === "expired"
                      ? "destructive"
                      : "outline"
                }
                style={{ fontSize: 10 }}
              >
                {status}
              </Badge>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(u)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  data-ocid={`admin.users.edit_button.${i + 1}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(u.username)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                  data-ocid={`admin.users.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
        {users.length === 0 && (
          <div
            className="text-center py-10 text-muted-foreground text-sm"
            data-ocid="admin.users.empty_state"
          >
            No users yet. Click "Add User" to create one.
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="rounded-2xl p-6 max-w-sm w-full mx-4"
              style={{
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
              }}
              data-ocid="admin.users.dialog"
            >
              <h3 className="font-semibold mb-2">Delete User</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Delete <strong>{deleteTarget}</strong>? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(deleteTarget!)}
                  className="flex-1"
                  data-ocid="admin.users.confirm_button"
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1"
                  data-ocid="admin.users.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Posts Tab ─────────────────────────────────────────────────────────────
function PostsTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pForm, setPForm] = useState({
    title: "",
    tagline: "",
    content: "",
    imageUrl: "",
    isPromotional: false,
  });
  const [previewImg, setPreviewImg] = useState("");
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => setPosts(getPosts()), []);
  useEffect(() => {
    reload();
  }, [reload]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPForm((p) => ({ ...p, imageUrl: url }));
      setPreviewImg(url);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!pForm.title.trim()) return;
    setPosting(true);
    try {
      savePost({
        title: pForm.title,
        tagline: pForm.tagline,
        content: pForm.content,
        imageUrl: pForm.imageUrl,
        isPromotional: pForm.isPromotional,
      });
      setPForm({
        title: "",
        tagline: "",
        content: "",
        imageUrl: "",
        isPromotional: false,
      });
      setPreviewImg("");
      setShowForm(false);
      reload();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg">
          Posts ({posts.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          className="gap-2"
          data-ocid="admin.posts.open_modal_button"
        >
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      {/* Post form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-5 mb-5"
            style={{
              background: "oklch(var(--muted))",
              border: "1px solid oklch(var(--border))",
            }}
            data-ocid="admin.posts.modal"
          >
            <h4 className="font-semibold text-sm mb-4">Create Post</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Heading *
                </Label>
                <Input
                  value={pForm.title}
                  onChange={(e) =>
                    setPForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Post heading"
                  className="mt-1"
                  data-ocid="admin.posts.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Tagline / Subtitle
                </Label>
                <Input
                  value={pForm.tagline}
                  onChange={(e) =>
                    setPForm((p) => ({ ...p, tagline: e.target.value }))
                  }
                  placeholder="Short tagline"
                  className="mt-1"
                  data-ocid="admin.posts.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  value={pForm.content}
                  onChange={(e) =>
                    setPForm((p) => ({ ...p, content: e.target.value }))
                  }
                  placeholder="Post body..."
                  rows={4}
                  className="mt-1 resize-none"
                  data-ocid="admin.posts.textarea"
                />
              </div>

              {/* Image upload */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Upload Image
                </Label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: "oklch(var(--secondary))",
                    border: "1px solid oklch(var(--border))",
                  }}
                  data-ocid="admin.posts.upload_button"
                >
                  <FileImage className="w-4 h-4" /> Choose Image
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImage}
                />
                {previewImg && (
                  <img
                    src={previewImg}
                    alt="preview"
                    className="mt-3 rounded-xl object-cover w-full"
                    style={{ maxHeight: 180 }}
                  />
                )}
              </div>

              {/* Promotional toggle */}
              <div className="flex items-center gap-3 py-1">
                <Switch
                  checked={pForm.isPromotional}
                  onCheckedChange={(v) =>
                    setPForm((p) => ({ ...p, isPromotional: v }))
                  }
                  data-ocid="admin.posts.switch"
                />
                <div>
                  <div className="text-sm font-medium">Promotional Post</div>
                  <div className="text-xs text-muted-foreground">
                    Adds animated gold border &amp; 🔥 badge
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handlePublish}
                  disabled={posting || !pForm.title.trim()}
                  className="gap-2 flex-1"
                  data-ocid="admin.posts.submit_button"
                >
                  {posting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publish
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  data-ocid="admin.posts.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts list */}
      <div className="space-y-3" data-ocid="admin.posts.list">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
            data-ocid={`admin.posts.item.${i + 1}`}
          >
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate text-foreground">
                {post.title}
              </div>
              {post.tagline && (
                <div className="text-xs italic text-muted-foreground">
                  {post.tagline}
                </div>
              )}
              <div className="text-xs text-muted-foreground truncate mt-1">
                {post.content}
              </div>
              {post.isPromotional && (
                <span
                  className="inline-flex items-center gap-1 mt-1 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(72% 0.18 75 / 0.2)",
                    color: "oklch(52% 0.18 75)",
                  }}
                >
                  🔥 PROMO
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                deletePost(post.id);
                reload();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-destructive shrink-0"
              data-ocid={`admin.posts.delete_button.${i + 1}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
        {posts.length === 0 && (
          <div
            className="text-center py-10 text-muted-foreground text-sm"
            data-ocid="admin.posts.empty_state"
          >
            No posts yet.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminPanel ────────────────────────────────────────────────────────
type AdminTab = "home" | "users" | "posts" | "ai";

export default function AdminPanel({
  adminUsername,
}: { adminUsername: string }) {
  const [tab, setTab] = useState<AdminTab>("home");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setUsers(getAllUsers());
    setPosts(getPosts());
    const id = setInterval(() => {
      setUsers(getAllUsers());
      setPosts(getPosts());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const activeUsers = users.filter((u) => {
    if (u.expiresAt === 0) return true;
    return Date.now() <= u.expiresAt;
  }).length;

  const TAB_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Dashboard", icon: "🏠" },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "posts", label: "Posts", icon: "📝" },
    { id: "ai", label: "AI", icon: <Brain className="w-4 h-4" /> },
  ];

  return (
    <section className="min-h-screen py-8 px-4 sm:px-6" data-ocid="admin.panel">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8 p-6"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(72% 0.18 75 / 0.3)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, oklch(72% 0.18 75), oklch(65% 0.22 30), oklch(72% 0.18 290), oklch(72% 0.18 75))",
              backgroundSize: "200% 100%",
              animation: "shimmer 3s linear infinite",
            }}
          />
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "oklch(75% 0.15 60 / 0.15)",
                border: "1px solid oklch(75% 0.15 60 / 0.3)",
              }}
            >
              <Shield
                className="w-6 h-6"
                style={{ color: "oklch(50% 0.13 60)" }}
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, <span className="font-semibold">@{adminUsername}</span>{" "}
                — Full access
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab navigation */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6 overflow-x-auto scrollbar-hide"
          style={{ background: "oklch(var(--muted))" }}
        >
          {TAB_ITEMS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? "shadow-sm" : "hover:bg-background/50"
              }`}
              style={{
                background: tab === t.id ? "oklch(var(--card))" : "transparent",
                color:
                  tab === t.id
                    ? "oklch(50% 0.13 60)"
                    : "oklch(var(--muted-foreground))",
              }}
              data-ocid={`admin.${t.id}.tab`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "home" && (
              <div>
                <h2 className="text-xl font-display font-bold mb-5">
                  Dashboard Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <BentoCard
                    label="Total Users"
                    value={users.length}
                    icon={<Users className="w-4 h-4" />}
                    color="oklch(72% 0.18 75)"
                    onClick={() => setTab("users")}
                  />
                  <BentoCard
                    label="Active Users"
                    value={activeUsers}
                    icon={<span>✓</span>}
                    color="oklch(62% 0.18 145)"
                    onClick={() => setTab("users")}
                  />
                  <BentoCard
                    label="Total Posts"
                    value={posts.length}
                    icon={<span>📝</span>}
                    color="oklch(65% 0.18 260)"
                    onClick={() => setTab("posts")}
                  />
                  <BentoCard
                    label="Promo Posts"
                    value={posts.filter((p) => p.isPromotional).length}
                    icon={<span>🔥</span>}
                    color="oklch(60% 0.18 25)"
                    onClick={() => setTab("posts")}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BentoCard
                    label="AI Status"
                    value="Auto-Learning"
                    icon={<Brain className="w-4 h-4" />}
                    color="oklch(65% 0.12 220)"
                    subtitle="Neural engine active"
                    onClick={() => setTab("ai")}
                  />
                  <BentoCard
                    label="Logged In Now"
                    value={Math.max(1, Math.floor(users.length * 0.3))}
                    icon={<span>🟢</span>}
                    color="oklch(62% 0.18 145)"
                    subtitle="Approximate active sessions"
                  />
                </div>
              </div>
            )}

            {tab === "users" && <UsersTab adminUsername={adminUsername} />}
            {tab === "posts" && <PostsTab />}
            {tab === "ai" && <AIDashboardPage />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
