import { Instagram, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { consumeCredit, getCredits, getCurrentUser } from "../lib/authManager";

interface Props {
  sectionName: string;
  children: ReactNode;
  onLogin: () => void;
}

export default function CreditGate({ sectionName, children, onLogin }: Props) {
  const user = getCurrentUser();
  const [credits, setCredits] = useState(() => getCredits());
  const deductedRef = useRef(false);

  const hasFullAccess =
    user?.isAdmin === true || (user != null && !user.isExpired);
  const isExpiredUser = user?.isExpired === true;

  useEffect(() => {
    if (!hasFullAccess && !deductedRef.current) {
      deductedRef.current = true;
      const ok = consumeCredit();
      setCredits(ok ? getCredits() : 0);
    }
  }, [hasFullAccess]);

  if (hasFullAccess) return <>{children}</>;

  const currentCredits = credits;
  const isLocked = currentCredits <= 0;

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-2, 2, -2, 0] }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 1,
            }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background:
                "linear-gradient(135deg, oklch(60% 0.15 60 / 0.15), oklch(52% 0.12 55 / 0.08))",
              border: "1px solid oklch(60% 0.15 60 / 0.3)",
              boxShadow: "0 8px 32px oklch(60% 0.15 60 / 0.12)",
            }}
          >
            <Lock className="w-9 h-9" style={{ color: "oklch(62% 0.15 60)" }} />
          </motion.div>

          <h2
            className="text-2xl font-display font-bold mb-3"
            style={{ color: "oklch(15% 0.01 240)" }}
          >
            Trading Access Required
          </h2>

          <p className="text-sm mb-6" style={{ color: "oklch(45% 0.02 240)" }}>
            {isExpiredUser
              ? "Your account has expired. Renew to continue trading."
              : `You've used your 10 free signals. Activate your account for unlimited access to ${sectionName}.`}
          </p>

          <div
            className="rounded-2xl p-5 mb-5 text-left"
            style={{
              background: "oklch(96% 0.008 60 / 0.5)",
              border: "1px solid oklch(62% 0.15 60 / 0.2)",
            }}
          >
            <p
              className="text-xs font-mono mb-3 font-bold uppercase tracking-wider"
              style={{ color: "oklch(52% 0.12 60)" }}
            >
              📱 Get Unlimited Access
            </p>
            <p
              className="text-sm mb-4"
              style={{ color: "oklch(40% 0.02 240)" }}
            >
              Message{" "}
              <span
                className="font-bold"
                style={{ color: "oklch(45% 0.13 60)" }}
              >
                @malverin_stonehart
              </span>{" "}
              on Instagram to activate your account.
            </p>
            <a
              href="https://www.instagram.com/malverin_stonehart?igsh=emUwMWVkOHY3bWMz&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="credit-gate.link"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background:
                  "linear-gradient(135deg, oklch(55% 0.18 5), oklch(50% 0.2 340))",
                color: "white",
                boxShadow: "0 4px 16px oklch(55% 0.18 5 / 0.3)",
              }}
            >
              <Instagram className="w-4 h-4" />
              Activate on Instagram
            </a>
          </div>

          <button
            type="button"
            onClick={onLogin}
            data-ocid="credit-gate.button"
            className="text-sm transition-colors"
            style={{ color: "oklch(52% 0.13 60)" }}
          >
            Already have an account?{" "}
            <span className="font-bold underline">Login</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {currentCredits > 0 && currentCredits < 10 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-4 mt-16 sm:mx-6 mb-2"
          >
            <div
              className="max-w-6xl mx-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono"
              style={{
                background: "oklch(75% 0.15 60 / 0.08)",
                border: "1px solid oklch(75% 0.15 60 / 0.2)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "oklch(62% 0.15 60)" }}
              />
              <span style={{ color: "oklch(45% 0.13 60)" }}>
                <strong>{currentCredits}</strong> free signal credit
                {currentCredits !== 1 ? "s" : ""} remaining ·{" "}
                <button
                  type="button"
                  onClick={onLogin}
                  className="underline font-bold"
                  data-ocid="credit-gate.button"
                >
                  Login for unlimited access
                </button>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
