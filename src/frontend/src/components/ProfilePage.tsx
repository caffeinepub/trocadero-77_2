import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Edit3, Lock, Save, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllUsers, getCurrentUser } from "../lib/authManager";

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string; // emoji or initials
}

const DEFAULT_PROFILE: ProfileData = {
  displayName: "",
  email: "",
  phone: "",
  bio: "",
  avatar: "🚀",
};

const AVATAR_OPTIONS = [
  "🚀",
  "💎",
  "🔥",
  "⚡",
  "🐂",
  "🐻",
  "🦁",
  "🌙",
  "⭐",
  "💰",
];

function getUID(username: string) {
  const key = `t77_uid_${username}`;
  let uid = localStorage.getItem(key);
  if (!uid) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    uid = `T77-${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
    localStorage.setItem(key, uid);
  }
  return uid;
}

function fmtExpiry(ts: number, isAdmin: boolean): string {
  if (isAdmin) return "Unlimited (Admin)";
  if (ts === 0) return "Permanent";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  currentUser: { username: string; isAdmin: boolean } | null;
  onLogin: () => void;
}

export default function ProfilePage({ currentUser, onLogin }: Props) {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [uid, setUID] = useState("");
  const [expiry, setExpiry] = useState<number>(0);

  useEffect(() => {
    if (!currentUser) return;
    const key = `t77_profile_${currentUser.username}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        setProfile(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    } else {
      setProfile({ ...DEFAULT_PROFILE, displayName: currentUser.username });
    }
    setUID(getUID(currentUser.username));

    if (!currentUser.isAdmin) {
      const users = getAllUsers();
      const u = users.find(
        (x) => x.username.toLowerCase() === currentUser.username.toLowerCase(),
      );
      setExpiry(u?.expiresAt ?? 0);
    }
  }, [currentUser]);

  const handleSave = () => {
    if (!currentUser) return;
    const key = `t77_profile_${currentUser.username}`;
    localStorage.setItem(key, JSON.stringify(profile));
    setEditing(false);
    toast.success("Profile saved!");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center space-y-4">
          <User className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-display font-bold">Not Logged In</h2>
          <p className="text-muted-foreground">
            Please log in to view your profile.
          </p>
          <Button
            onClick={onLogin}
            className="bg-primary text-primary-foreground"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  const isActive = currentUser.isAdmin || expiry === 0 || Date.now() < expiry;

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account details
            </p>
          </div>

          {/* Avatar + Identity Card */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center gap-5 mb-5">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shrink-0"
                style={{
                  background: "oklch(var(--muted))",
                  border: "2px solid oklch(var(--border))",
                }}
              >
                {profile.avatar}
              </div>
              <div>
                <div className="font-display font-bold text-xl">
                  {profile.displayName || currentUser.username}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {uid}
                </div>
                <div
                  className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: isActive
                      ? "oklch(62% 0.18 145 / 0.15)"
                      : "oklch(60% 0.18 25 / 0.15)",
                    color: isActive
                      ? "oklch(42% 0.18 145)"
                      : "oklch(45% 0.18 25)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{
                      background: isActive
                        ? "oklch(42% 0.18 145)"
                        : "oklch(45% 0.18 25)",
                    }}
                  />
                  {isActive ? "Active" : "Expired"}
                </div>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-2 gap-4">
              <ReadonlyField
                icon={<User className="w-4 h-4" />}
                label="Username"
                value={currentUser.username}
              />
              <ReadonlyField
                icon={<Lock className="w-4 h-4" />}
                label="Password"
                value="••••••••"
              />
              <ReadonlyField
                icon={<Shield className="w-4 h-4" />}
                label="User ID"
                value={uid}
              />
              <ReadonlyField
                icon={<Clock className="w-4 h-4" />}
                label="Expires"
                value={fmtExpiry(expiry, currentUser.isAdmin)}
              />
            </div>
          </div>

          {/* Editable fields */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Edit Details</h2>
              {!editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="gap-2"
                  data-ocid="profile.edit_button"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Button>
              )}
            </div>

            {/* Avatar picker */}
            {editing && (
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Avatar
                </Label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, avatar: em }))}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        profile.avatar === em
                          ? "ring-2 ring-primary scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ background: "oklch(var(--muted))" }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  value={profile.displayName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, displayName: e.target.value }))
                  }
                  disabled={!editing}
                  className="mt-1"
                  data-ocid="profile.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, email: e.target.value }))
                  }
                  disabled={!editing}
                  className="mt-1"
                  data-ocid="profile.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                  disabled={!editing}
                  className="mt-1"
                  data-ocid="profile.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Bio / Tagline
                </Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, bio: e.target.value }))
                  }
                  disabled={!editing}
                  className="mt-1 resize-none"
                  rows={3}
                  data-ocid="profile.textarea"
                />
              </div>

              {editing && (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    className="gap-2 flex-1"
                    data-ocid="profile.save_button"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                    data-ocid="profile.cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ReadonlyField({
  icon,
  label,
  value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        background: "oklch(var(--muted))",
        border: "1px solid oklch(var(--border))",
      }}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-mono text-foreground truncate">{value}</div>
    </div>
  );
}
