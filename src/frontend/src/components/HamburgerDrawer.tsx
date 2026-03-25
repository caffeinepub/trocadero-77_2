import {
  BarChart2,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  Home,
  Newspaper,
  Shield,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/authManager";

interface DrawerLink {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const LINKS: DrawerLink[] = [
  { id: "profile", label: "PROFILE", icon: <User className="w-4 h-4" /> },
  { id: "home", label: "HOME", icon: <Home className="w-4 h-4" /> },
  { id: "postpage", label: "POST", icon: <FileText className="w-4 h-4" /> },
  { id: "newspage", label: "NEWS", icon: <Newspaper className="w-4 h-4" /> },
  {
    id: "tracking",
    label: "TRACKING",
    icon: <BarChart2 className="w-4 h-4" />,
  },
  {
    id: "aidashboard",
    label: "AI DASHBOARD",
    icon: <Brain className="w-4 h-4" />,
  },
  { id: "founder", label: "FOUNDER", icon: <Users className="w-4 h-4" /> },
  {
    id: "controlroom",
    label: "CONTROL ROOM",
    icon: <Shield className="w-4 h-4" />,
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNav: (id: string) => void;
  currentUser: { username: string; isAdmin: boolean } | null;
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

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

function getUserExpiry(username: string) {
  try {
    const users = JSON.parse(localStorage.getItem("t77_users") ?? "[]");
    const u = users.find(
      (x: { username: string }) =>
        x.username.toLowerCase() === username.toLowerCase(),
    );
    if (!u) return null;
    return u.expiresAt;
  } catch {
    return null;
  }
}

function fmtExpiry(ts: number | null, isAdmin: boolean): string {
  if (isAdmin) return "Unlimited";
  if (!ts || ts === 0) return "Permanent";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HamburgerDrawer({
  isOpen,
  onClose,
  onNav,
  currentUser,
}: Props) {
  const [userInfo, setUserInfo] = useState<{
    uid: string;
    expiry: number | null;
  } | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const uid = getUID(currentUser.username);
    const expiry = currentUser.isAdmin
      ? null
      : getUserExpiry(currentUser.username);
    setUserInfo({ uid, expiry });
    const interval = setInterval(() => {
      const newExpiry = currentUser.isAdmin
        ? null
        : getUserExpiry(currentUser.username);
      setUserInfo({ uid, expiry: newExpiry });
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleNav = (id: string) => {
    onNav(id);
    onClose();
  };

  const subStatus = () => {
    if (!currentUser) return { label: "Guest", color: "#9ca3af" };
    if (currentUser.isAdmin) return { label: "Admin", color: "#f59e0b" };
    const expiry = userInfo?.expiry;
    if (!expiry || expiry === 0)
      return { label: "Active – Permanent", color: "#22c55e" };
    if (Date.now() > expiry) return { label: "Expired", color: "#ef4444" };
    return { label: "Active", color: "#22c55e" };
  };

  const status = subStatus();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[70] w-72 flex flex-col shadow-2xl"
            style={{
              background: "oklch(var(--card))",
              borderRight: "1px solid oklch(var(--border))",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="font-display font-bold text-base shimmer-text">
                TROCADERO 77
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="px-4 py-4 border-b border-border">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "oklch(var(--secondary))",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                {currentUser ? (
                  <>
                    {/* Avatar */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, #f59e0b, #d97706)",
                        }}
                      >
                        {getInitials(currentUser.username)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-foreground truncate">
                          {currentUser.username}
                        </div>
                        {currentUser.isAdmin && (
                          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground mb-0.5">UID</div>
                        <div className="font-mono text-foreground truncate">
                          {userInfo?.uid ?? "..."}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">
                          Status
                        </div>
                        <div
                          className="font-semibold"
                          style={{ color: status.color }}
                        >
                          {status.label}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-0.5">
                          Expires
                        </div>
                        <div className="font-mono text-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fmtExpiry(
                            userInfo?.expiry ?? null,
                            currentUser.isAdmin,
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "oklch(var(--muted))" }}
                    >
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Guest User
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Not logged in
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {LINKS.map((link, i) => (
                <motion.button
                  key={link.id}
                  type="button"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleNav(link.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-accent/10 text-foreground/80 hover:text-foreground mb-1"
                  data-ocid={`drawer.${link.id}.link`}
                >
                  <span className="text-muted-foreground">{link.icon}</span>
                  {link.label}
                </motion.button>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-signal-buy" />
                AI Engine Active
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
