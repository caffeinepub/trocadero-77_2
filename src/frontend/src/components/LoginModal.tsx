import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Instagram,
  Loader2,
  LogIn,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { login } from "../lib/authManager";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string, isAdmin: boolean) => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    setIsLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 600));
    const result = login(username.trim(), password);
    setIsLoading(false);
    if (result.success) {
      onSuccess(username.trim(), result.isAdmin);
      setUsername("");
      setPassword("");
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            role="button"
            tabIndex={-1}
            aria-label="Close modal"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
            }}
          >
            {/* Gold accent top strip */}
            <div
              className="h-1 w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(72% 0.18 75), oklch(65% 0.22 30), oklch(72% 0.18 75), transparent)",
              }}
            />

            <div className="p-6 sm:p-8">
              {/* Logo */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "oklch(97% 0.01 60)",
                    border: "1.5px solid oklch(72% 0.18 75 / 0.4)",
                    boxShadow: "0 4px 16px oklch(72% 0.18 75 / 0.15)",
                  }}
                >
                  <TrendingUp
                    className="w-7 h-7"
                    style={{ color: "oklch(62% 0.18 75)" }}
                  />
                </div>
                <h2
                  className="text-xl font-bold tracking-tight"
                  style={{ color: "oklch(20% 0.01 240)" }}
                >
                  TROCADERO 77
                </h2>
                <p className="text-xs font-mono mt-1 text-gray-400">
                  Member Access Portal
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-username"
                    className="text-xs font-mono uppercase tracking-wider text-gray-500"
                  >
                    Username
                  </Label>
                  <Input
                    id="login-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="username"
                    data-ocid="login.input"
                    className="text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-password"
                    className="text-xs font-mono uppercase tracking-wider text-gray-500"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      data-ocid="login.input"
                      className="pr-10 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-lg px-3 py-2.5 text-xs font-mono bg-red-50 border border-red-200 text-red-600"
                        data-ocid="login.error_state"
                      >
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isLoading}
                  data-ocid="login.submit_button"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] disabled:opacity-60"
                  style={{
                    background: isLoading
                      ? "oklch(80% 0.08 75)"
                      : "linear-gradient(135deg, oklch(62% 0.18 75), oklch(52% 0.15 65))",
                    color: "#ffffff",
                    boxShadow: isLoading
                      ? "none"
                      : "0 4px 16px oklch(62% 0.15 75 / 0.35)",
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 pt-5 text-center border-t border-gray-100">
                <p className="text-xs mb-3 text-gray-400">Need an account?</p>
                <a
                  href="https://www.instagram.com/malverin_stonehart?igsh=emUwMWVkOHY3bWMz&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="login.link"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #fdf0f5, #fce4ec)",
                    border: "1px solid rgba(225,80,120,0.25)",
                    color: "#c2185b",
                  }}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Message us on Instagram
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
