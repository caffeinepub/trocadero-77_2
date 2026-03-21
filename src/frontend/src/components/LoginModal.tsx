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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
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
              background:
                "linear-gradient(145deg, oklch(14% 0.02 240), oklch(10% 0.01 240))",
              border: "1px solid oklch(75% 0.15 60 / 0.25)",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px oklch(75% 0.15 60 / 0.08), inset 0 1px 0 oklch(75% 0.15 60 / 0.1)",
            }}
          >
            <div
              className="h-0.5 w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(75% 0.15 60), transparent)",
              }}
            />

            <div className="p-6 sm:p-8">
              {/* Logo */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(75% 0.15 60 / 0.2), oklch(60% 0.12 55 / 0.1))",
                    border: "1px solid oklch(75% 0.15 60 / 0.3)",
                  }}
                >
                  <TrendingUp
                    className="w-7 h-7"
                    style={{ color: "oklch(75% 0.15 60)" }}
                  />
                </div>
                <h2
                  className="text-xl font-bold tracking-tight"
                  style={{ color: "oklch(75% 0.15 60)" }}
                >
                  TROCADERO 77
                </h2>
                <p
                  className="text-xs font-mono mt-1"
                  style={{ color: "oklch(70% 0.02 240)" }}
                >
                  Member Access Portal
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-username"
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: "oklch(65% 0.02 240)" }}
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
                    className="border-0 text-sm"
                    style={{
                      background: "oklch(20% 0.01 240)",
                      border: "1px solid oklch(75% 0.15 60 / 0.2)",
                      color: "oklch(90% 0.01 240)",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-password"
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: "oklch(65% 0.02 240)" }}
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
                      className="pr-10 border-0 text-sm"
                      style={{
                        background: "oklch(20% 0.01 240)",
                        border: "1px solid oklch(75% 0.15 60 / 0.2)",
                        color: "oklch(90% 0.01 240)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "oklch(55% 0.02 240)" }}
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
                        className="rounded-lg px-3 py-2.5 text-xs font-mono"
                        style={{
                          background: "oklch(60% 0.18 25 / 0.15)",
                          border: "1px solid oklch(60% 0.18 25 / 0.3)",
                          color: "oklch(75% 0.12 25)",
                        }}
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
                      ? "oklch(50% 0.12 60 / 0.5)"
                      : "linear-gradient(135deg, oklch(62% 0.15 60), oklch(52% 0.13 55))",
                    color: "oklch(98% 0.005 240)",
                    boxShadow: isLoading
                      ? "none"
                      : "0 4px 16px oklch(62% 0.15 60 / 0.35)",
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

              <div
                className="mt-6 pt-5 text-center"
                style={{ borderTop: "1px solid oklch(75% 0.15 60 / 0.1)" }}
              >
                <p
                  className="text-xs mb-3"
                  style={{ color: "oklch(55% 0.02 240)" }}
                >
                  Need an account?
                </p>
                <a
                  href="https://www.instagram.com/malverin_stonehart?igsh=emUwMWVkOHY3bWMz&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="login.link"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(55% 0.18 5 / 0.2), oklch(60% 0.2 340 / 0.15))",
                    border: "1px solid oklch(60% 0.15 5 / 0.35)",
                    color: "oklch(82% 0.1 5)",
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
