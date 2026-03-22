import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit2,
  Eye,
  EyeOff,
  FileImage,
  Loader2,
  Plus,
  Rocket,
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

type Duration = "1" | "7" | "365" | "never";

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: "1", label: "1 Day" },
  { value: "7", label: "1 Week" },
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
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface FormData {
  username: string;
  password: string;
  duration: Duration;
}

const EMPTY_FORM: FormData = { username: "", password: "", duration: "365" };

// ─── Animated Stat Card ──────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
}: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplayed(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: "#ffffff",
        border: `1px solid ${color}40`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
        }}
      />
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: "#6b7280" }}
        >
          {label}
        </span>
      </div>
      <div className="text-3xl font-display font-bold" style={{ color }}>
        {displayed}
      </div>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab({ adminUsername }: { adminUsername: string }) {
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
      if (editingUser) {
        const ok = updateUser(editingUser, {
          password: form.password || undefined,
          durationDays: getDays(form.duration),
        });
        if (!ok) {
          setFormError("Update failed.");
          return;
        }
      } else {
        const result = createUser(
          form.username.trim(),
          form.password,
          getDays(form.duration),
        );
        if (!result.success) {
          setFormError(result.error || "Failed to create user.");
          return;
        }
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingUser(null);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (user: ManagedUser) => {
    setEditingUser(user.username);
    setForm({ username: user.username, password: "", duration: "365" });
    setShowForm(true);
    setFormError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget);
    setDeleteTarget(null);
    reload();
  };

  return (
    <div className="space-y-6">
      {/* Create button */}
      {!showForm && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowForm(true);
            setEditingUser(null);
            setForm(EMPTY_FORM);
            setFormError("");
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono font-semibold text-sm transition-all"
          style={{
            background:
              "linear-gradient(135deg, oklch(72% 0.18 75), oklch(62% 0.15 65))",
            color: "white",
            boxShadow: "0 4px 20px oklch(72% 0.18 75 / 0.4)",
          }}
          data-ocid="admin.users.open_modal_button"
        >
          <Plus className="w-4 h-4" />
          Create New User
        </motion.button>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            onSubmit={handleSubmit}
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            data-ocid="admin.users.modal"
          >
            <div className="flex items-center justify-between mb-2">
              <h3
                className="font-display font-bold"
                style={{ color: "oklch(40% 0.15 75)" }}
              >
                {editingUser ? `Edit @${editingUser}` : "Create New User"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
                className="text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-mono text-gray-500">
                  Username
                </Label>
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  disabled={!!editingUser}
                  placeholder="username"
                  className="mt-1 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400"
                  data-ocid="admin.users.input"
                />
              </div>
              <div>
                <Label className="text-xs font-mono text-gray-500">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder={
                      editingUser ? "Leave blank to keep" : "password"
                    }
                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400 pr-9"
                    data-ocid="admin.users.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

            <div>
              <Label
                className="text-xs font-mono"
                style={{ color: "oklch(55% 0.05 240)" }}
              >
                Expiration
              </Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, duration: opt.value }))
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all"
                    style={{
                      background:
                        form.duration === opt.value
                          ? "oklch(72% 0.18 75)"
                          : "#f3f4f6",
                      color: form.duration === opt.value ? "white" : "#6b7280",
                      border: `1px solid ${form.duration === opt.value ? "oklch(62% 0.18 75)" : "#d1d5db"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <p
                className="text-xs font-mono"
                style={{ color: "#dc2626" }}
                data-ocid="admin.users.error_state"
              >
                ⚠ {formError}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(72% 0.18 75), oklch(62% 0.15 65))",
                  color: "white",
                  border: "none",
                }}
                data-ocid="admin.users.submit_button"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editingUser ? "Update User" : "Create User"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
                className="border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                data-ocid="admin.users.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: "#fff5f5",
              border: "1px solid #fca5a5",
            }}
            data-ocid="admin.users.dialog"
          >
            <p className="text-sm font-mono" style={{ color: "#dc2626" }}>
              Delete user{" "}
              <strong style={{ color: "#111827" }}>@{deleteTarget}</strong>?
              This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={confirmDelete}
                style={{
                  background: "oklch(55% 0.22 25)",
                  color: "white",
                  border: "none",
                }}
                data-ocid="admin.users.confirm_button"
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="border-gray-200 text-gray-500"
                data-ocid="admin.users.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {users.length === 0 ? (
          <div className="p-8 text-center" data-ocid="admin.users.empty_state">
            <Users
              className="w-8 h-8 mx-auto mb-3"
              style={{ color: "#9ca3af" }}
            />
            <p className="text-sm font-mono" style={{ color: "#9ca3af" }}>
              No users yet. Create one above.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {["User", "Expires", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest"
                    style={{ color: "#9ca3af" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const status = getUserStatus(user);
                const statusColor =
                  status === "active"
                    ? "oklch(62% 0.18 145)"
                    : status === "permanent"
                      ? "oklch(72% 0.18 75)"
                      : "oklch(65% 0.2 25)";
                return (
                  <tr
                    key={user.username}
                    style={{
                      borderBottom:
                        i < users.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}
                    data-ocid={`admin.users.row.${i + 1}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: "oklch(96% 0.04 75)",
                            color: "oklch(48% 0.18 75)",
                          }}
                        >
                          {user.username[0].toUpperCase()}
                        </div>
                        <span className="font-mono text-gray-800">
                          @{user.username}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs"
                      style={{ color: "#6b7280" }}
                    >
                      {fmtDate(user.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold"
                        style={{
                          background: `${statusColor}20`,
                          color: statusColor,
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.username !== adminUsername && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(user)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-amber-50"
                              style={{ color: "oklch(72% 0.18 75)" }}
                              data-ocid={`admin.users.edit_button.${i + 1}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(user.username)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-amber-50"
                              style={{ color: "oklch(65% 0.2 25)" }}
                              data-ocid={`admin.users.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {user.username === adminUsername && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-400/30 text-amber-400/70"
                          >
                            you
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Posts Tab ───────────────────────────────────────────────────────────────
function PostsTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPromotional, setIsPromotional] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => setPosts(getPosts()), []);
  useEffect(() => {
    reload();
  }, [reload]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl((ev.target?.result as string) ?? "");
    reader.readAsDataURL(file);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      savePost({
        title: title.trim(),
        content: content.trim(),
        imageUrl,
        isPromotional,
      });
      setTitle("");
      setContent("");
      setImageUrl("");
      setIsPromotional(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create form */}
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handlePublish}
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
        data-ocid="admin.posts.modal"
      >
        <h3
          className="font-display font-bold text-base"
          style={{ color: "oklch(40% 0.15 75)" }}
        >
          Create New Post
        </h3>

        <div>
          <Label className="text-xs font-mono text-gray-500">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="mt-1 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400"
            data-ocid="admin.posts.input"
          />
        </div>

        <div>
          <Label className="text-xs font-mono text-gray-500">Content</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content..."
            rows={4}
            className="mt-1 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400 resize-none"
            data-ocid="admin.posts.textarea"
          />
        </div>

        {/* Image upload */}
        <div>
          <Label className="text-xs font-mono text-gray-500">
            Image (optional)
          </Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            className="mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-sm transition-all w-full justify-center"
            style={{
              background: imageUrl ? "oklch(62% 0.18 145 / 0.15)" : "#f9fafb",
              border: `1px dashed ${imageUrl ? "oklch(62% 0.18 145 / 0.6)" : "#d1d5db"}`,
              color: imageUrl ? "oklch(50% 0.18 145)" : "#6b7280",
            }}
            data-ocid="admin.posts.upload_button"
          >
            <FileImage className="w-4 h-4" />
            {imageUrl ? "✓ Image selected — click to change" : "Upload Image"}
          </motion.button>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-2 rounded-xl max-h-40 object-cover w-full"
            />
          )}
        </div>

        {/* Promotional toggle */}
        <div>
          <Label className="text-xs font-mono mb-2 block text-gray-500">
            Promotional Setting
          </Label>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsPromotional((v) => !v)}
            className="w-full rounded-xl p-4 font-mono text-sm font-semibold transition-all text-left flex items-center gap-4"
            style={{
              background: isPromotional
                ? "linear-gradient(135deg, oklch(72% 0.18 75 / 0.2), oklch(65% 0.22 30 / 0.2))"
                : "#f9fafb",
              border: `2px solid ${isPromotional ? "oklch(72% 0.18 75)" : "#e5e7eb"}`,
              boxShadow: isPromotional
                ? "0 0 24px oklch(72% 0.18 75 / 0.3)"
                : "none",
              animation: isPromotional
                ? "promo-glow 2s ease-in-out infinite"
                : "none",
            }}
            data-ocid="admin.posts.toggle"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{
                background: isPromotional ? "oklch(72% 0.18 75)" : "#e5e7eb",
                boxShadow: isPromotional
                  ? "0 0 16px oklch(72% 0.18 75 / 0.6)"
                  : "none",
              }}
            >
              {isPromotional ? "🔥" : "📄"}
            </div>
            <div>
              <div
                style={{
                  color: isPromotional ? "oklch(50% 0.18 75)" : "#374151",
                }}
              >
                {isPromotional ? "Promotional — ON" : "Mark as Promotional"}
              </div>
              <div
                className="text-xs font-normal mt-0.5"
                style={{ color: "#9ca3af" }}
              >
                Gets special animated highlight on homepage
              </div>
            </div>
            {isPromotional && (
              <div className="ml-auto">
                <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            )}
          </motion.button>

          {/* Preview */}
          {isPromotional && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 rounded-xl"
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <p
                className="text-xs font-mono mb-2"
                style={{ color: "#9ca3af" }}
              >
                Preview on homepage:
              </p>
              <div
                className="rounded-xl p-3"
                style={{
                  padding: "2px",
                  background:
                    "linear-gradient(135deg, oklch(72% 0.18 75), oklch(65% 0.22 30), oklch(72% 0.18 75))",
                  backgroundSize: "200% 200%",
                  animation: "promo-gradient 3s ease infinite",
                }}
              >
                <div
                  className="rounded-[10px] p-3 text-xs"
                  style={{ background: "#fffbf0" }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: "oklch(72% 0.18 75)",
                        color: "white",
                      }}
                    >
                      🔥 PROMO
                    </span>
                  </div>
                  <div
                    className="font-bold"
                    style={{ color: "oklch(25% 0.02 60)" }}
                  >
                    {title || "Your post title"}
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: "oklch(45% 0.02 60)" }}
                  >
                    {content.slice(0, 60) || "Post content preview..."}
                    {content.length > 60 ? "..." : ""}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={saving || !title.trim() || !content.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:
              "linear-gradient(135deg, oklch(72% 0.18 75), oklch(62% 0.15 65))",
            color: "white",
            boxShadow: "0 4px 20px oklch(72% 0.18 75 / 0.4)",
          }}
          data-ocid="admin.posts.submit_button"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4" />
          )}
          🚀 Publish Post
        </motion.button>
      </motion.form>

      {/* Posts list */}
      {posts.length > 0 && (
        <div className="space-y-3" data-ocid="admin.posts.list">
          <h3
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: "#9ca3af" }}
          >
            Published Posts
          </h3>
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
              }}
              data-ocid={`admin.posts.item.${i + 1}`}
            >
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#f3f4f6" }}
                >
                  <FileImage className="w-5 h-5" style={{ color: "#9ca3af" }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-sm font-medium truncate"
                    style={{ color: "#111827" }}
                  >
                    {post.title}
                  </span>
                  {post.isPromotional && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{
                        background: "oklch(72% 0.18 75 / 0.2)",
                        color: "oklch(72% 0.18 75)",
                      }}
                    >
                      🔥 PROMO
                    </span>
                  )}
                </div>
                <p
                  className="text-xs font-mono truncate mt-0.5"
                  style={{ color: "#9ca3af" }}
                >
                  {post.content.slice(0, 60)}
                  {post.content.length > 60 ? "..." : ""}
                </p>
              </div>
              {deleteTarget === post.id ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      deletePost(post.id);
                      setDeleteTarget(null);
                      reload();
                    }}
                    className="px-2 py-1 rounded-lg text-xs font-mono font-semibold"
                    style={{ background: "oklch(55% 0.22 25)", color: "white" }}
                    data-ocid={`admin.posts.confirm_button.${i + 1}`}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="px-2 py-1 rounded-lg text-xs font-mono"
                    style={{ color: "oklch(55% 0.03 240)" }}
                    data-ocid={`admin.posts.cancel_button.${i + 1}`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(post.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 flex-shrink-0"
                  style={{ color: "oklch(65% 0.2 25)" }}
                  data-ocid={`admin.posts.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes promo-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes promo-glow {
          0%, 100% { box-shadow: 0 0 24px oklch(72% 0.18 75 / 0.3); }
          50% { box-shadow: 0 0 40px oklch(72% 0.18 75 / 0.5); }
        }
      `}</style>
    </div>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
interface Props {
  adminUsername: string;
}

export default function AdminPanel({ adminUsername }: Props) {
  const [activeTab, setActiveTab] = useState<"users" | "posts">("users");

  const users = getAllUsers();
  const posts = getPosts();
  const activeUsers = users.filter((u) => {
    if (u.expiresAt === 0) return true;
    return Date.now() <= u.expiresAt;
  }).length;

  return (
    <section
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{ background: "#f8f9fa" }}
      data-ocid="admin.panel"
    >
      <div className="max-w-4xl mx-auto">
        {/* Animated header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8 p-8"
          style={{
            background: "linear-gradient(135deg, #ffffff, #f9fafb)",
            border: "1px solid oklch(72% 0.18 75 / 0.3)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          {/* Floating orbs */}
          {["orb-0", "orb-1", "orb-2"].map((orbKey, i) => (
            <div
              key={orbKey}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: [120, 80, 160][i],
                height: [120, 80, 160][i],
                top: ["10%", "60%", "-20%"][i],
                left: ["5%", "75%", "60%"][i],
                background: `radial-gradient(circle, oklch(72% 0.18 75 / ${[0.08, 0.06, 0.05][i]}) 0%, transparent 70%)`,
                animation: `float-orb-${i} ${[6, 8, 10][i]}s ease-in-out infinite`,
              }}
            />
          ))}

          {/* Animated gradient bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, oklch(72% 0.18 75), oklch(65% 0.22 30), oklch(72% 0.18 290), oklch(72% 0.18 75))",
              backgroundSize: "200% 100%",
              animation: "header-bar 3s linear infinite",
            }}
          />

          <div className="relative flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(96% 0.04 75), oklch(94% 0.05 65))",
                border: "1.5px solid oklch(72% 0.18 75 / 0.5)",
                boxShadow: "0 4px 16px oklch(72% 0.18 75 / 0.2)",
              }}
            >
              <Shield
                className="w-7 h-7"
                style={{ color: "oklch(72% 0.18 75)" }}
              />
            </motion.div>
            <div>
              <h1
                className="font-display font-bold text-2xl"
                style={{ color: "oklch(72% 0.18 75)" }}
              >
                Admin Panel
              </h1>
              <p
                className="text-sm font-mono mt-0.5"
                style={{ color: "oklch(55% 0.05 240)" }}
              >
                Welcome,{" "}
                <span style={{ color: "oklch(50% 0.18 75)" }}>
                  @{adminUsername}
                </span>{" "}
                — Full access granted
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            label="Total Users"
            value={users.length}
            icon={<Users className="w-4 h-4" />}
            color="oklch(72% 0.18 75)"
          />
          <StatCard
            label="Active"
            value={activeUsers}
            icon={<span className="text-sm">✓</span>}
            color="oklch(62% 0.18 145)"
          />
          <StatCard
            label="Posts"
            value={posts.length}
            icon={<span className="text-sm">📝</span>}
            color="oklch(65% 0.18 260)"
          />
          <StatCard
            label="Promos"
            value={posts.filter((p) => p.isPromotional).length}
            icon={<span className="text-sm">🔥</span>}
            color="oklch(65% 0.22 30)"
          />
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="relative flex gap-1 p-1 rounded-2xl mb-6"
          style={{
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
          }}
        >
          {(["users", "posts"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="relative flex-1 py-2.5 rounded-xl font-mono font-semibold text-sm transition-colors z-10"
              style={{
                color: activeTab === tab ? "#ffffff" : "#6b7280",
              }}
              data-ocid={`admin.${tab}.tab`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="admin-tab-indicator"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(72% 0.18 75 / 0.3), oklch(62% 0.15 65 / 0.2))",
                    border: "1px solid oklch(72% 0.18 75 / 0.4)",
                  }}
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
              <span className="relative">
                {tab === "users" ? "👥 Users" : "📝 Posts"}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "users" ? (
              <UsersTab adminUsername={adminUsername} />
            ) : (
              <PostsTab />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes header-bar {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float-orb-0 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -15px); }
        }
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 20px); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, 25px); }
        }
      `}</style>
    </section>
  );
}
